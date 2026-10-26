import BottomNav from "@/components/BottomNav";

// Layout for every signed-in screen: content column + bottom tab bar.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
