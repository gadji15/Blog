import { useTranslation } from '@/lib/i18n';

export default function CookiesPage() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-[calc(100vh-5rem)] container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('cookies')}</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="lead">
            This Cookie Policy explains how StreamFlow uses cookies and similar technologies to recognize you when you visit our website and services. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>
          
          <h2>What are cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <p>
            Cookies set by the website owner (in this case, StreamFlow) are called "first-party cookies". Cookies set by parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
          </p>
          
          <h2>Why do we use cookies?</h2>
          <p>
            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Websites to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Websites for advertising, analytics, and other purposes. This is described in more detail below.
          </p>
          
          <h2>The specific types of first and third-party cookies served through our Website and the purposes they perform</h2>
          <p>
            Essential website cookies: These cookies are strictly necessary to provide you with services available through our Websites and to use some of its features, such as access to secure areas.
          </p>
          <p>
            Performance and functionality cookies: These cookies are used to enhance the performance and functionality of our Websites but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.
          </p>
          <p>
            Analytics and customization cookies: These cookies collect information that is used either in aggregate form to help us understand how our Websites are being used or how effective our marketing campaigns are, or to help us customize our Websites for you.
          </p>
          <p>
            Advertising cookies: These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.
          </p>
          <p>
            Social networking cookies: These cookies are used to enable you to share pages and content that you find interesting on our Websites through third-party social networking and other websites. These cookies may also be used for advertising purposes.
          </p>
          
          <h2>How can you control cookies?</h2>
          <p>
            You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
          </p>
          <p>
            The Cookie Consent Manager can be found in the notification banner and on our website. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
          </p>
          <p>
            The specific types of first and third-party cookies served through our Websites and the purposes they perform are described in the table below:
          </p>
          
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr>
                <th className="border border-border p-2">Type of Cookie</th>
                <th className="border border-border p-2">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2">Session Cookies</td>
                <td className="border border-border p-2">These cookies are temporary and expire once you close your browser. They are used to maintain your session and basic website functionality.</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Persistent Cookies</td>
                <td className="border border-border p-2">These cookies remain on your device for a set period of time or until you delete them. They are used to remember your preferences and settings for future visits.</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Authentication Cookies</td>
                <td className="border border-border p-2">These cookies help us identify you when you log in to our website so that we can provide you with access to your account and maintain appropriate security.</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Analytics Cookies</td>
                <td className="border border-border p-2">These cookies collect information about how you use our website, which pages you visit, and any errors you might encounter. This data helps us improve our website and your experience.</td>
              </tr>
              <tr>
                <td className="border border-border p-2">Preference Cookies</td>
                <td className="border border-border p-2">These cookies remember information you've entered or choices you've made such as your language preference or region, so we can provide you with a more personalized experience.</td>
              </tr>
            </tbody>
          </table>
          
          <h2>How often will we update this Cookie Policy?</h2>
          <p>
            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
          </p>
          <p>
            The date at the top of this Cookie Policy indicates when it was last updated.
          </p>
          
          <h2>Where can I get further information?</h2>
          <p>
            If you have any questions about our use of cookies or other technologies, please email us at privacy@streamflow.com.
          </p>
          
          <p className="text-sm mt-8">Last Updated: October 2023</p>
        </div>
      </div>
    </div>
  );
}
