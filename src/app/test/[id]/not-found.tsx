import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-bg px-6 text-center">
      <div>
        <p className="eyebrow text-faint">Block not found</p>
        <h1 className="mt-2 text-[26px] font-[750]">This block doesn&apos;t exist or isn&apos;t yours.</h1>
        <Link href="/tests" className="mt-4 inline-block font-semibold text-brand-strong hover:underline">
          Go to previous tests
        </Link>
      </div>
    </div>
  );
}
