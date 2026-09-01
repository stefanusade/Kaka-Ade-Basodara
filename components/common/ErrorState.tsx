export default function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-10 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500"
    >
      {message}
    </div>
  );
}
