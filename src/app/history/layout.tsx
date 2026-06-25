import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "决策日记",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
