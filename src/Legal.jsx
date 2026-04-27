import { useState } from 'react'
import { FileText, Shield, AlertTriangle, ChevronRight } from 'lucide-react'

export default function Legal() {
  const [activeDoc, setActiveDoc] = useState(null)

  const documents = {
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      content: `
<h2>Terms of Service</h2>
<p>Last Updated: January 2024</p>

<h3>1. Acceptance of Terms</h3>
<p>By accessing and using InsiderX, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h3>2. Description of Service</h3>
<p>InsiderX is a digital trading simulation platform that allows users to practice trading with virtual funds. All trading activities on this platform are for educational and simulation purposes only.</p>

<h3>3. Demo Account</h3>
<p>Users receive a demo account with $10,000 in virtual funds. This is purely simulated money with no real monetary value. No real money is involved in any transactions on this platform.</p>

<h3>4. No Real Trading</h3>
<p>THIS PLATFORM DOES NOT FACILITATE REAL MONEY TRADING. All trades, bets, and transactions are simulations using virtual currency. Users cannot deposit or withdraw real money.</p>

<h3>5. Risk Warning</h3>
<p>Trading financial instruments carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you.</p>

<h3>6. Intellectual Property</h3>
<p>All content, features, and functionality of InsiderX are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>

<h3>7. User Responsibilities</h3>
<p>Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.</p>

<h3>8. Limitation of Liability</h3>
<p>InsiderX shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>

<h3>9. Changes to Terms</h3>
<p>We reserve the right to modify these terms at any time. Your continued use of the platform constitutes acceptance of any changes.</p>

<h3>10. Contact</h3>
<p>If you have any questions about these Terms, please contact us through the platform.</p>
      `
    },
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      content: `
<h2>Privacy Policy</h2>
<p>Last Updated: January 2024</p>

<h3>1. Information We Collect</h3>
<p>We collect information you provide directly to us, including name, email address, and account credentials when you register.</p>

<h3>2. How We Use Information</h3>
<p>We use the information we collect to:
<ul>
  <li>Provide, maintain, and improve our services</li>
  <li>Send you technical notices and support messages</li>
  <li>Respond to your comments and questions</li>
  <li>Communicate with you about products, services, and events</li>
</ul>
</p>

<h3>3. Data Storage</h3>
<p>Your data is stored on secure servers. We implement appropriate technical and organizational measures to protect your personal information.</p>

<h3>4. Cookies</h3>
<p>We use cookies and similar technologies to enhance your experience. You can control cookies through your browser settings.</p>

<h3>5. Third-Party Sharing</h3>
<p>We do not sell, trade, or otherwise transfer your personal information to outside parties unless we provide users with advance notice.</p>

<h3>6. Data Retention</h3>
<p>We will retain your personal information only for as long as necessary for the purposes set out in this privacy policy.</p>

<h3>7. Children's Privacy</h3>
<p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

<h3>8. Your Rights</h3>
<p>You have the right to access, update, or delete your personal information at any time through your account settings.</p>

<h3>9. Changes to Policy</h3>
<p>We may update our privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

<h3>10. Contact</h3>
<p>If you have any questions about this Privacy Policy, please contact us.</p>
      `
    },
    risk: {
      title: 'Risk Warning',
      icon: AlertTriangle,
      content: `
<h2>Risk Warning</h2>
<p>Last Updated: January 2024</p>

<div style="background: var(--red-dim); padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="color: var(--red); margin-top: 0;">IMPORTANT WARNING</h3>
  <p>Trading financial instruments involves a high degree of risk and may not be suitable for all investors.</p>
</div>

<h3>1. Capital at Risk</h3>
<p>The financial instruments traded on this platform are for <strong>educational and simulation purposes only</strong>. While the platform simulates real market conditions, no real money is involved.</p>

<h3>2. Demo Account Disclaimer</h3>
<p>This platform provides a demo trading environment where you can practice with virtual funds. The $10,000 (or any other amount) in your demo account has <strong>no real monetary value</strong> and cannot be converted to real money.</p>

<h3>3. No Real Trading</h3>
<p>InsiderX does NOT facilitate real money trading, real deposits, or real withdrawals. All transactions are simulations.</p>

<h3>4. Risk Factors</h3>
<p>When trading real financial markets, you could lose some or all of your initial investment. You should only trade with money you can afford to lose.</p>

<h3>5. No Guarantees</h3>
<p>Past performance is not indicative of future results. Trading strategies that work in the past may not work in the future.</p>

<h3>6. Market Volatility</h3>
<p>Financial markets can be extremely volatile. Prices may rise and fall rapidly, and you may not be able to sell your positions at the desired price.</p>

<h3>7. Leverage Risk</h3>
<p>Using leverage (margin trading) can amplify both profits and losses. You may lose more than your initial investment.</p>

<h3>8. Educational Purpose</h3>
<p>This platform is designed solely for educational purposes to help users understand how trading works. It should not be considered financial advice.</p>

<h3>9. Seek Professional Advice</h3>
<p>If you plan to trade with real money, you should seek advice from a qualified financial advisor.</p>

<h3>10. By Using This Platform</h3>
<p>By using InsiderX, you acknowledge that you understand this is a simulation platform and that no real money is involved in any transactions.</p>
      `
    },
    aml: {
      title: 'AML Policy',
      icon: Shield,
      content: `
<h2>Anti-Money Laundering (AML) Policy</h2>
<p>Last Updated: January 2024</p>

<h3>1. Policy Statement</h3>
<p>InsiderX is committed to preventing money laundering and terrorist financing. As this is a demo platform with no real money transactions, this policy outlines our commitment to compliance.</p>

<h3>2. No Real Transactions</h3>
<p>Since InsiderX does not facilitate real money transactions, deposits, or withdrawals, traditional AML procedures for financial institutions do not apply.</p>

<h3>3. User Verification</h3>
<p>We may collect and verify user information to maintain platform integrity and prevent abuse.</p>

<h3>4. Monitoring</h3>
<p>We monitor platform activity for suspicious patterns that might indicate abusive or improper use of the platform.</p>

<h3>5. Reporting</h3>
<p>If we detect any suspicious activity, we reserve the right to investigate and report to relevant authorities as required by law.</p>

<h3>6. Compliance</h3>
<p>We will cooperate with law enforcement agencies and regulatory authorities as required.</p>

<h3>7. Training</h3>
<p>Our team receives training on AML awareness and recognizing suspicious activities.</p>

<h3>8. Policy Updates</h3>
<p>We may update this policy as needed to reflect changes in regulations and best practices.</p>

<h3>9. Contact</h3>
<p>For AML-related inquiries, please contact our support team.</p>
      `
    }
  }

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Legal Documents</h2>
      
      {!activeDoc ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {Object.entries(documents).map(([key, doc]) => (
            <div key={key} onClick={() => setActiveDoc(key)}
              className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <doc.icon size={20} color="var(--green)" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{doc.title}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                Read document <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveDoc(null)} className="btn btn-ghost" style={{ marginBottom: 16 }}>
            ← Back to Documents
          </button>
          <div className="card" style={{ padding: 32 }}>
            <div dangerouslySetInnerHTML={{ __html: documents[activeDoc].content }} 
              style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }} />
          </div>
        </div>
      )}
    </div>
  )
}
