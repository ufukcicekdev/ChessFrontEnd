export default function DrawOfferBanner({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="card border-yellow-500/30 bg-yellow-500/10 text-center flex flex-col gap-2">
      <p className="text-sm font-medium">Opponent offers a draw</p>
      <div className="flex gap-2">
        <button onClick={onAccept}  className="btn-primary flex-1 text-sm">Accept</button>
        <button onClick={onDecline} className="btn-danger flex-1 text-sm">Decline</button>
      </div>
    </div>
  );
}
