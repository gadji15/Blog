import { useTranslation } from '@/lib/i18n';

export default function TermsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-[calc(100vh-5rem)] container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('terms')}</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="lead">
            Welcome to StreamFlow. By accessing our website and services, you agree to these Terms of Use.
          </p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or using our service, you are agreeing to be bound by these Terms of Use. If you do not agree to these Terms of Use, do not access or use our service.
          </p>
          
          <h2>2. Changes to Terms of Use</h2>
          <p>
            StreamFlow may, from time to time, change these Terms of Use. We will notify you of any changes by posting the new Terms of Use on the StreamFlow website and updating the "Last Updated" date.
          </p>
          
          <h2>3. Privacy</h2>
          <p>
            Your use of our service is subject to our Privacy Policy, which explains how we collect, use, and disclose information about you. By using our service, you agree to the collection, use, and disclosure of your information as set forth in the Privacy Policy.
          </p>
          
          <h2>4. StreamFlow Service</h2>
          <p>
            The StreamFlow service and any content viewed through our service are for your personal and non-commercial use only. During your StreamFlow membership, we grant you a limited, non-exclusive, non-transferable license to access the StreamFlow service.
          </p>
          
          <h2>5. Passwords & Account Access</h2>
          <p>
            The member who created the StreamFlow account and whose payment method is charged is referred to as the Account Owner. The Account Owner is responsible for maintaining the confidentiality of the password and for restricting access to the account. The Account Owner is responsible for any activity that occurs through the account.
          </p>
          
          <h2>6. Membership, Free Trials, Billing and Cancellation</h2>
          <p>
            Your StreamFlow membership will continue until terminated. To use the StreamFlow service you must have Internet access and a StreamFlow ready device, and provide a current, valid, accepted method of payment. We may offer a number of membership plans, including memberships offered by third parties in conjunction with the provision of their own products and services. We are not responsible for the products and services provided by such third parties.
          </p>
          
          <h2>7. StreamFlow Service</h2>
          <p>
            You must be at least 18 years of age to become a member of the StreamFlow service. Minors may only use the service under the supervision of an adult.
          </p>
          
          <h2>8. Content on the Service</h2>
          <p>
            The StreamFlow service and all content viewed through our service are protected by copyright, trademark, and other intellectual property laws. The StreamFlow service, including all features and functionalities, website, user interfaces, all content and software associated therewith, are protected by copyright, trademark, trade secret and other intellectual property or proprietary rights laws.
          </p>
          
          <h2>9. Use of the Service</h2>
          <p>
            You agree not to archive, download, reproduce, distribute, modify, display, perform, publish, license, create derivative works from, offer for sale, or use content and information contained on or obtained from or through the StreamFlow service.
          </p>
          
          <h2>10. Disclaimers of Warranties and Limitations on Liability</h2>
          <p>
            THE STREAMFLOW SERVICE AND ALL CONTENT AND SOFTWARE ASSOCIATED THEREWITH, OR ANY OTHER FEATURES OR FUNCTIONALITIES ASSOCIATED WITH THE STREAMFLOW SERVICE, ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND.
          </p>
          
          <h2>11. Governing Law</h2>
          <p>
            These Terms of Use shall be governed by and construed in accordance with the laws of the United States of America.
          </p>
          
          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Use, please contact us at support@streamflow.com.
          </p>
          
          <p className="text-sm mt-8">Last Updated: October 2023</p>
        </div>
      </div>
    </div>
  );
}
