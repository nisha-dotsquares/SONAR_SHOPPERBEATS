import Link from "next/link";
import '../../styles/contact-banner.css'

export default function ContactBanner() {
  return (
    <div className="contact-bg mb-70">
      <div className="container">
        <div className="contact-content">
          <h3>Contact Customer Care</h3>
          <p>
            Get in contact with our Customer Care Team via your customer dashboard.
          </p>

          <Link href="/contact" className="btn btn-red btn-filled">
            Contact Customer Care
          </Link>
        </div>
      </div>
    </div>
  );
}
