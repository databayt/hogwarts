import SiteHeader from "@/components/template/site-header/content";
// import { SiteFooter } from "@/components/site-footer";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-slot="site-layout">
      <SiteHeader />
      <main 
        data-slot="main-content"
        role="main"
      >
        {children}
      </main>
      {/* <SiteFooter /> */}
    </div>
  );
}