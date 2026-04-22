"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/Toast";

export default function DonateButton({ roomId }: { roomId: string }) {
  const { toasts, add, remove } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("5");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDonate = async () => {
    setLoading(true);
    try {
      await api.post(`/api/chess/rooms/${roomId}/donate/`, {
        amount: parseFloat(amount), currency: "USD", message,
      });
      setSuccess(true);
      add("Donation sent! Thank you ❤️", "success");
      setTimeout(() => { setOpen(false); setSuccess(false); }, 2000);
    } catch {
      add("Donation failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm flex items-center justify-center gap-2">
          💰 Support a Player
        </button>
      ) : (
        <div className="card flex flex-col gap-3">
          <p className="font-semibold text-sm">Support this room</p>
          {success ? (
            <p className="text-emerald-400 text-sm text-center">Thank you! ❤️</p>
          ) : (
            <>
              <div className="flex gap-2">
                {["1","5","10","20"].map((v) => (
                  <button key={v} onClick={() => setAmount(v)}
                    className={`flex-1 py-1 rounded text-sm font-mono border transition-colors ${
                      amount === v ? "border-amber-500 bg-amber-500/20 text-amber-400" : "border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}>
                    ${v}
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1"
                placeholder="Custom amount" className="input text-sm py-2" />
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Message (optional)" maxLength={200} className="input text-sm py-2" />
              <div className="flex gap-2">
                <button onClick={handleDonate} disabled={loading || !amount} className="btn-primary flex-1 text-sm">
                  {loading ? "…" : "Donate"}
                </button>
                <button onClick={() => setOpen(false)} className="btn-secondary text-sm px-3">✕</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
