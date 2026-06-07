import React from "react";
import { Header } from "@/components/layout/Header";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-[72px]">{children}</main>
    </>
  );
}
