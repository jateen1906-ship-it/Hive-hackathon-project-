import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BillingAPI, loadRazorpay } from "@/lib/apiClient";

export function useBilling() {
  const q = useQuery({ queryKey: ["billing-me"], queryFn: BillingAPI.me });
  const ent = q.data;
  const cfg = ent?.config || {};
  return {
    ...q,
    entitlement: ent,
    plan: ent?.plan || "free",
    config: cfg,
    can: {
      liveDistance: !!cfg.live_distance,
      fieldCorrection: cfg.field_correction !== false,
      share: (cfg.share_links === null) || (cfg.share_links > 0),
      corridorView: cfg.corridor && cfg.corridor !== "hidden",
      corridorDrilldown: !!cfg.corridor_drilldown,
      apiAccess: !!cfg.api_access,
    },
  };
}

// Start Razorpay checkout for a paid tier; verifies server-side on success.
export async function startCheckout({ tier, user, onSuccess }) {
  const loaded = await loadRazorpay();
  if (!loaded) {
    toast.error("Could not load the payment gateway. Please retry.");
    return;
  }
  let order;
  try {
    order = await BillingAPI.subscribe(tier);
  } catch (e) {
    toast.error(e.message || "Could not start checkout");
    return;
  }
  const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency || "INR",
    name: "TruckShield",
    description: `${order.plan_name} plan (monthly)`,
    order_id: order.order_id,
    prefill: {
      name: user?.full_name || "Fleet Operator",
      email: user?.email || "billing@truckshield.app",
      contact: "9999999999",
    },
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
    },
    theme: { color: "#0f172a" },
    handler: async (res) => {
      try {
        await BillingAPI.verify({
          razorpay_payment_id: res.razorpay_payment_id,
          razorpay_order_id: res.razorpay_order_id,
          razorpay_signature: res.razorpay_signature,
        });
        toast.success(`${order.plan_name} plan activated successfully!`);
        onSuccess && onSuccess();
      } catch (e) {
        toast.error(e.message || "Payment verification failed");
      }
    },
    modal: { ondismiss: () => toast.message("Checkout cancelled") },
  };
  new window.Razorpay(options).open();
}
