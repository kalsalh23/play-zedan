// POST /api/admin-action — confirm payment / cancel / refund / retry / complete
import {
  sb, getSettings, requireAdmin, createMcBill, getMcBill, log, ok, fail, readBody, httpError,
} from './_lib.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'طريقة غير مسموحة' })
  try {
    await requireAdmin(req)
    const { id, action, note, result_code } = await readBody(req)
    if (!id || !action) throw httpError(400, 'طلب غير مكتمل')
    const { data: order, error } = await sb.from('orders').select('*').eq('id', id).single()
    if (error || !order) throw httpError(404, 'الطلب غير موجود')
    const s = await getSettings()
    const demo = s.mc_demo === 'true'
    const now = new Date().toISOString()

    if (action === 'confirm') {
      if (!['awaiting_payment'].includes(order.status)) throw httpError(400, 'لا يمكن تأكيد هذا الطلب في حالته الحالية')
      await sb.from('orders').update({ status: 'paid', paid_at: now, updated_at: now }).eq('id', order.id)
      try {
        if (demo) {
          await sb.from('orders').update({ status: 'processing', mc_status: 'demo', updated_at: new Date().toISOString() }).eq('id', order.id)
        } else {
          const j = await createMcBill(s, { product_id: order.product_mc_id, id_user: order.id_user, amount: order.amount })
          const bill = j?.data?.bill || j?.bill || j?.data
          const billId = bill?.id || j?.id
          const st = String(bill?.status || '').toLowerCase()
          const patch = { mc_bill_id: billId || null, updated_at: new Date().toISOString() }
          if (['success', 'done', 'completed'].includes(st)) {
            patch.status = 'completed'
            patch.result_code = bill?.data_id != null ? String(bill.data_id) : ''
          } else {
            patch.status = 'processing'
            patch.mc_status = st || 'pending'
          }
          await sb.from('orders').update(patch).eq('id', order.id)
        }
        await log('fulfill', 'تأكيد دفع وبدء شحن ' + order.code)
        return ok(res, { message: 'تم تأكيد الدفع وبدء الشحن' })
      } catch (e2) {
        await sb.from('orders').update({ status: 'failed', cancel_note: 'تعذر إرسال الطلب للمزود: ' + e2.message, updated_at: new Date().toISOString() }).eq('id', order.id)
        await log('fulfill', 'فشل إرسال ' + order.code + ': ' + e2.message)
        return ok(res, { message: 'تم تسجيل الدفع لكن تعذر الإرسال للمزود — جرّب إعادة المحاولة', warning: true })
      }
    }

    if (action === 'retry') {
      if (!['failed', 'cancelled'].includes(order.status)) throw httpError(400, 'إعادة المحاولة متاحة للطلبات الفاشلة أو الملغاة فقط')
      if (demo) {
        await sb.from('orders').update({ status: 'processing', cancel_note: '', updated_at: now }).eq('id', order.id)
        return ok(res, { message: 'أُعيد إرسال الطلب (وضع تجريبي)' })
      }
      const j = await createMcBill(s, { product_id: order.product_mc_id, id_user: order.id_user, amount: order.amount })
      const bill = j?.data?.bill || j?.bill || j?.data
      await sb.from('orders').update({ status: 'processing', mc_bill_id: bill?.id || null, cancel_note: '', updated_at: now }).eq('id', order.id)
      return ok(res, { message: 'أُعيد إرسال الطلب للمزود' })
    }

    if (action === 'cancel') {
      if (!['awaiting_payment', 'failed'].includes(order.status)) throw httpError(400, 'لا يمكن إلغاء هذا الطلب في حالته الحالية')
      await sb.from('orders').update({ status: 'cancelled', cancel_note: note || 'أُلغي الطلب من الإدارة', updated_at: now }).eq('id', order.id)
      return ok(res, { message: 'أُلغي الطلب' })
    }

    if (action === 'refund') {
      if (!['cancelled', 'failed'].includes(order.status)) throw httpError(400, 'الإرجاع متاح بعد الإلغاء أو الفشل')
      await sb.from('orders').update({ status: 'refunded', updated_at: now }).eq('id', order.id)
      await log('refund', 'إرجاع مبلغ ' + order.code, { wallet: order.customer_wallet })
      return ok(res, { message: 'عُلّم الطلب كمُرتجع — لا تنسَ تحويل المبلغ للزبون عبر شام كاش' })
    }

    if (action === 'complete') {
      if (!['processing', 'paid'].includes(order.status)) throw httpError(400, 'الإكمال اليدوي متاح للطلبات الجارية فقط')
      await sb.from('orders').update({ status: 'completed', result_code: result_code || '', updated_at: now }).eq('id', order.id)
      return ok(res, { message: 'أُكمل الطلب يدوياً' })
    }

    if (action === 'check') {
      if (order.status !== 'processing' || !order.mc_bill_id) throw httpError(400, 'لا يوجد ما يمكن فحصه')
      const j = await getMcBill(s, order.mc_bill_id)
      const bill = j?.data?.bill || j?.data || j?.bill
      const st = String(bill?.status || '').toLowerCase()
      const patch = { mc_status: st, updated_at: now }
      if (['success', 'done', 'completed'].includes(st)) {
        patch.status = 'completed'
        patch.result_code = bill?.data_id != null ? String(bill.data_id) : ''
      } else if (['cancel', 'cancelled', 'failed'].includes(st)) {
        patch.status = 'cancelled'
        patch.cancel_note = bill?.cancel_note || 'ألغيت العملية لدى المزود'
      } else {
        return ok(res, { message: 'الحالة لدى المزود: ' + (st || 'غير معروفة') })
      }
      await sb.from('orders').update(patch).eq('id', order.id)
      return ok(res, { message: 'تم تحديث الحالة: ' + patch.status })
    }

    throw httpError(400, 'إجراء غير معروف')
  } catch (e) {
    return fail(res, e)
  }
}
