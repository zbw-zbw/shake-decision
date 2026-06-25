export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center relative z-10">
      <div className="w-8 h-8 border-2 border-[rgba(79,70,229,0.3)] border-t-[#7c3aed] rounded-full animate-spin mb-4" />
      <p className="text-sm text-[rgba(255,255,255,0.5)]">加载中...</p>
    </div>
  );
}
