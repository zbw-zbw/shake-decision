import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "开始决策",
};

export default function DecideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
