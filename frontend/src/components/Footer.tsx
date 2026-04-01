import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-text text-background-alt mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">AutoParts Hub</span>
            </div>
            <p className="text-sm text-text-light">
              Your trusted marketplace for premium automotive parts and accessories worldwide.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t("quickLinks") || "Quick Links"}</h3>
            <ul className="space-y-3">
              <li><Link href="/search" className="text-sm text-text-light hover:text-white transition-colors">{t("browseParts") || "Browse Parts"}</Link></li>
              <li><Link href="/search?condition=new" className="text-sm text-text-light hover:text-white transition-colors">{t("newParts") || "New Parts"}</Link></li>
              <li><Link href="/search?condition=used" className="text-sm text-text-light hover:text-white transition-colors">{t("usedParts") || "Used Parts"}</Link></li>
              <li><Link href="/auth/register" className="text-sm text-text-light hover:text-white transition-colors">{t("sellOnHub") || "Sell on AutoParts Hub"}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t("categoriesTitle") || "Categories"}</h3>
            <ul className="space-y-3">
              <li><Link href="/search?category=engine-parts" className="text-sm text-text-light hover:text-white transition-colors">{t("engineParts") || "Engine Parts"}</Link></li>
              <li><Link href="/search?category=brake-system" className="text-sm text-text-light hover:text-white transition-colors">{t("brakeSystem") || "Brake System"}</Link></li>
              <li><Link href="/search?category=suspension" className="text-sm text-text-light hover:text-white transition-colors">{t("suspension") || "Suspension"}</Link></li>
              <li><Link href="/search?category=electrical" className="text-sm text-text-light hover:text-white transition-colors">{t("electrical") || "Electrical"}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{t("support") || "Support"}</h3>
            <ul className="space-y-3">
              <li><span className="text-sm text-text-light cursor-pointer hover:text-white">{t("helpCenter") || "Help Center"}</span></li>
              <li><span className="text-sm text-text-light cursor-pointer hover:text-white">{t("shippingInfo") || "Shipping Info"}</span></li>
              <li><span className="text-sm text-text-light cursor-pointer hover:text-white">{t("returns") || "Returns"}</span></li>
              <li><span className="text-sm text-text-light cursor-pointer hover:text-white">{t("contactUs") || "Contact Us"}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-light">
            &copy; {new Date().getFullYear()} AutoParts Hub. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-xs text-text-light cursor-pointer hover:text-white">{t("privacyPolicy") || "Privacy Policy"}</span>
            <span className="text-xs text-text-light cursor-pointer hover:text-white">{t("termsOfService") || "Terms of Service"}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
