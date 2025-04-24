import { useTranslation } from '@/lib/i18n';

export default function PrivacyPage() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-[calc(100vh-5rem)] container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('privacy')}</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="lead">
            At StreamFlow, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
          
          <h2>1. Information We Collect</h2>
          <p>
            We collect several types of information from and about users of our platform, including:
          </p>
          <ul>
            <li>
              <strong>Personal Information:</strong> We may collect personal information that you provide to us, such as your name, email address, postal address, telephone number, and payment information.
            </li>
            <li>
              <strong>Usage Information:</strong> We collect information about your interactions with our platform, such as the content you view, the features you use, the time and duration of your visits, and the search terms you enter.
            </li>
            <li>
              <strong>Device Information:</strong> We collect information about the devices you use to access our service, including hardware models, operating system, unique device identifiers, and mobile network information.
            </li>
            <li>
              <strong>Location Information:</strong> We may collect information about your approximate location based on your IP address.
            </li>
          </ul>
          
          <h2>2. How We Use Your Information</h2>
          <p>
            We may use the information we collect from you for various purposes, including to:
          </p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information, including confirmations and receipts</li>
            <li>Send administrative messages, such as updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Personalize your experience and deliver content and product and service offerings relevant to your interests</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Protect the rights, property, and safety of StreamFlow, our users, and others</li>
          </ul>
          
          <h2>3. Disclosure of Your Information</h2>
          <p>
            We may disclose personal information that we collect or you provide as described in this privacy policy:
          </p>
          <ul>
            <li>To our subsidiaries and affiliates</li>
            <li>To contractors, service providers, and other third parties we use to support our business</li>
            <li>To fulfill the purpose for which you provide it</li>
            <li>For any other purpose disclosed by us when you provide the information</li>
            <li>With your consent</li>
          </ul>
          <p>
            We may also disclose your personal information:
          </p>
          <ul>
            <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request</li>
            <li>To enforce or apply our terms of use and other agreements</li>
            <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of StreamFlow, our customers, or others</li>
          </ul>
          
          <h2>4. Data Security</h2>
          <p>
            We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls. Any payment transactions will be encrypted using SSL technology.
          </p>
          
          <h2>5. Your Choices About Our Collection, Use, and Disclosure of Your Information</h2>
          <p>
            We strive to provide you with choices regarding the personal information you provide to us. We have created mechanisms to provide you with the following control over your information:
          </p>
          <ul>
            <li>
              <strong>Tracking Technologies and Advertising:</strong> You can set your browser to refuse all or some browser cookies, or to alert you when cookies are being sent.
            </li>
            <li>
              <strong>Promotional Offers from the Company:</strong> If you do not wish to have your email address used by the Company to promote our own or third parties' products or services, you can opt-out by checking the relevant box located on the form on which we collect your data or by sending us an email stating your request.
            </li>
          </ul>
          
          <h2>6. Changes to Our Privacy Policy</h2>
          <p>
            It is our policy to post any changes we make to our privacy policy on this page. If we make material changes to how we treat our users' personal information, we will notify you through a notice on the Website home page.
          </p>
          
          <h2>7. Contact Information</h2>
          <p>
            To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@streamflow.com
          </p>
          
          <p className="text-sm mt-8">Last Updated: October 2023</p>
        </div>
      </div>
    </div>
  );
}
