"use client";
import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

const CARD_STYLE = {
  style: {
    base: {
      color: "#e5e7eb",
      fontFamily: "monospace",
      fontSize: "14px",
      "::placeholder": { color: "#6b7280" },
    },
    invalid: { color: "#f87171" },
  },
};

function DonateForm({ roomId, onClose }: { roomId: string; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toasts, add, remove } = useToast();

  const [amount, setAmount] = useState("5");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDonate = useCallback(async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setLoading(true);
    try {
      // 1. Backend'den PaymentIntent client_secret al
      const { data } = await api.post(`/api/chess/rooms/${roomId}/donate/`, {
        amount: parseFloat(amount),
        currency: "USD",
        message,
      });

      // 2. Stripe'a kartı onayla
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        { payment_method: { card } }
      );

      if (error) {
        add(error.message ?? "Payment failed.", "error");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        setSuccess(true);
        add("Donation sent! Thank you ❤️", "success");
        setTimeout(onClose, 2500);
      }
    } catch {
      add("Donation failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [stripe, elements, roomId, amount, message, add, onClose]);

  if (success) {
    return (
      <div className="card text-center py-6">
        <p className="text-2xl mb-2">❤️</p>
        <p className="text-emerald-400 font-semibold">Thank you!</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Support this game</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {["1", "5", "10", "20"].map((v) => (
            <button key={v} onClick={() => setAmount(v)}
              className={`flex-1 py-1 rounded text-sm font-mono border transition-colors ${
                amount === v
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}>
              ${v}
            </button>
          ))}
        </div>

        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          min="1" max="10000" placeholder="Custom amount"
          className="input text-sm py-2" />

        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Message (optional)" maxLength={200} className="input text-sm py-2" />

        {/* Stripe card element */}
        <div className="input py-3">
          <CardElement options={CARD_STYLE} />
        </div>

        <button
          onClick={handleDonate}
          disabled={loading || !stripe || !amount || parseFloat(amount) <= 0}
          className="btn-primary text-sm w-full"
        >
          {loading ? "Processing…" : `Donate $${parseFloat(amount || "0").toFixed(2)}`}
        </button>

        <p className="text-[10px] text-gray-600 text-center">Secured by Stripe</p>
      </div>
    </>
  );
}

export default function DonateButton({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
        💰 Support a Player
      </button>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <DonateForm roomId={roomId} onClose={() => setOpen(false)} />
    </Elements>
  );
}
