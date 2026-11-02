import BottomNav from "@/components/BottomNav";

// Layout for every signed-in screen: content column + tab bar on phones,
// wider content + sidebar on desktop.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="w-full px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28 lg:pt-8 lg:pr-8 lg:pb-8 lg:pl-64">
        <div className="mx-auto w-full max-w-md lg:max-w-6xl">{children}</div>
      </main>
      <BottomNav />
    </>
  );
}
