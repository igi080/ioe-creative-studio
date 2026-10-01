-- ==============================================================================
-- IOE CREATIVE STUDIO - LEGAL POLICIES SCHEMA & SEED DATA (STEP 1)
-- Table: public.legal_policies
-- 
-- Manages:
--   1. Privacy Policy (slug: 'privacy-policy')
--   2. Terms of Service (slug: 'terms-of-service')
--   3. Client / Service Agreement (slug: 'client-agreement')
-- 
-- Source of Truth for Studio Contact Details:
--   - Email: Igiharuwe7@gmail.com
--   - Phone: +234 704 649 4532
--   - WhatsApp: +234 904 005 9278
-- ==============================================================================

-- 1. Create table public.legal_policies
CREATE TABLE IF NOT EXISTS public.legal_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    badge_text TEXT,
    subtitle TEXT,
    content TEXT NOT NULL,
    key_highlights JSONB DEFAULT '[]'::jsonb,
    last_updated TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.legal_policies ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Public read access for published policies only
DROP POLICY IF EXISTS "Allow public read published legal_policies" ON public.legal_policies;
CREATE POLICY "Allow public read published legal_policies" 
    ON public.legal_policies 
    FOR SELECT 
    USING (is_published = true);

-- 4. RLS Policy: Authenticated admins can view all policies (both published & draft)
DROP POLICY IF EXISTS "Allow admins to read all legal_policies" ON public.legal_policies;
CREATE POLICY "Allow admins to read all legal_policies" 
    ON public.legal_policies 
    FOR SELECT 
    TO authenticated 
    USING (public.is_admin());

-- 5. RLS Policy: Authenticated admins can insert policies
DROP POLICY IF EXISTS "Allow admins to insert legal_policies" ON public.legal_policies;
CREATE POLICY "Allow admins to insert legal_policies" 
    ON public.legal_policies 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (public.is_admin());

-- 6. RLS Policy: Authenticated admins can update policies
DROP POLICY IF EXISTS "Allow admins to update legal_policies" ON public.legal_policies;
CREATE POLICY "Allow admins to update legal_policies" 
    ON public.legal_policies 
    FOR UPDATE 
    TO authenticated 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. RLS Policy: Authenticated admins can delete policies
DROP POLICY IF EXISTS "Allow admins to delete legal_policies" ON public.legal_policies;
CREATE POLICY "Allow admins to delete legal_policies" 
    ON public.legal_policies 
    FOR DELETE 
    TO authenticated 
    USING (public.is_admin());

-- 8. Table Grants (PostgreSQL permissions)
GRANT SELECT ON TABLE public.legal_policies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legal_policies TO authenticated;

-- ==============================================================================
-- 9. SEED DATA: CURRENT CORRECTED LEGAL DOCUMENTS
-- ==============================================================================

-- Document 1: Privacy Policy
INSERT INTO public.legal_policies (
    slug,
    title,
    badge_text,
    subtitle,
    last_updated,
    is_published,
    key_highlights,
    content
) VALUES (
    'privacy-policy',
    'Privacy Policy',
    'Privacy & Data Protection',
    'Your privacy and trust are paramount at IOE Creative Studio. This policy outlines how we handle, safeguard, and respect your personal information and creative assets.',
    'September 19, 2026',
    true,
    '[
        {
            "icon": "Shield",
            "title": "Data Protection",
            "description": "We protect all personal details, creative briefs, and brand assets with enterprise-grade encryption."
        },
        {
            "icon": "Eye",
            "title": "Zero Selling of Data",
            "description": "We never sell, rent, or trade your personal or project information to any third parties."
        },
        {
            "icon": "Lock",
            "title": "Confidentiality",
            "description": "Client files, source materials, and project correspondence remain strictly confidential."
        },
        {
            "icon": "Server",
            "title": "Secure Infrastructure",
            "description": "Stored via high-security cloud services with encrypted transfers and strict access control."
        }
    ]'::jsonb,
    $privacy_content$
## 1. Introduction & Overview

IOE Creative Studio ("we," "our," or "us"), led by **Igiharuwe Olayinka Emmanuel**, provides high-caliber creative design, motion graphics, 2D/3D animation, and full-stack web development services.

This Privacy Policy applies to our website (`https://ioecreativestudio.com` and related domains), customer interactions, project onboarding workflows, project deliverables, and communications. By accessing our services, submitting inquiries, or engaging us for design or software engineering work, you acknowledge and agree to the data practices described herein.

---

## 2. Information We Collect

We collect information that you provide directly to us, as well as technical information generated automatically during your interaction with our site:

### A. Personal Identification & Contact Details
When you submit an inquiry, request a quote, book a project, or contact us through WhatsApp or email, we collect your name, email address, phone number, company/organization name, and communication history.

### B. Creative Briefs & Project Assets
For active design, animation, and web development contracts, we collect brand guides, logos, style boards, copy, audio files, video clips, and technical specifications necessary to complete your project.

### C. Billing & Transaction Information
Payment records, invoices, and transaction references. Financial card details are securely processed directly by our authorized payment providers (such as Paystack or Stripe) and are never stored on our servers.

### D. Technical & Device Data
Standard web telemetry including browser type, operating system, IP address, screen resolution, referral sources, and page interaction timestamps used for security and performance optimization.

---

## 3. How We Use Your Information

We use the collected information strictly for legitimate business purposes:

- **Fulfilling Creative & Technical Engagements:** Delivering custom graphic design, brand identities, motion graphics, animations, and web applications according to client contracts.
- **Client Communication:** Responding to inquiries, sending proposals, updating project timelines, and providing post-delivery technical support.
- **Billing & Administration:** Generating official invoices, verifying payments, and maintaining accounting records.
- **Security & Optimization:** Protecting our infrastructure against unauthorized access, malicious attacks, and service interruptions.
- **Portfolio Showcases:** Displaying completed work in our public showcase solely when authorized by client agreement or non-confidential project releases.

---

## 4. Data Storage, Confidentiality & Security

We implement industry-standard administrative, physical, and electronic security safeguards:

- **Encryption in Transit & At Rest:** All traffic across our platform is transmitted using modern TLS/SSL encryption protocols.
- **Secure Cloud Infrastructure:** We utilize trusted cloud providers (including Supabase with Row Level Security and Cloudflare R2 object storage with presigned credential gating) to protect media and operational databases.
- **Restricted Access:** Access to sensitive project files and client data is restricted exclusively to authorized studio personnel under confidentiality obligations.

---

## 5. Third-Party Services & Integrations

We do not sell, trade, or monetize your personal data. We only share information with reputable service partners essential to studio operations:

- **Cloud Hosting & Storage:** Cloudflare R2, Google Cloud, Supabase for scalable, secure infrastructure and media hosting.
- **Payment Gateways:** Encrypted merchant processors (e.g., Paystack/Stripe) that handle checkout without exposing credentials.

---

## 6. Your Rights & Data Controls

Regardless of your geographical location, we respect your privacy rights under global data protection regulations (including GDPR and CCPA):

- **Access & Review:** You may request a copy of the personal information we retain about you.
- **Correction & Updates:** You have the right to correct any inaccurate or incomplete details.
- **Deletion (Right to be Forgotten):** You may request permanent deletion of your contact records and non-essential files, subject to contractual and legal record-keeping obligations.
- **Portfolio Removal:** If your project was displayed with previous consent and you wish to retract public showcase permissions, you may request removal at any time.

---

## 7. Cookies & Tracking

We use strictly necessary session identifiers and client-side storage to manage theme preferences, administrative login sessions, and site navigation performance. We do not deploy invasive ad-retargeting cookies or third-party behavioral trackers.

---

## 8. Changes to This Privacy Policy

We may update this policy periodically to reflect operational, legal, or regulatory advancements. Any modifications will be posted directly to this page with an updated "Last Updated" timestamp.

---

## 9. Contact & Data Controller

If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact our data lead directly:

- **Studio:** IOE Creative Studio
- **Creative Lead:** Igiharuwe Olayinka Emmanuel
- **Email:** Igiharuwe7@gmail.com
- **Phone:** +234 704 649 4532
- **WhatsApp:** +234 904 005 9278
- **Response Commitment:** We respond to all verified inquiries within 24–48 business hours.
$privacy_content$
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    badge_text = EXCLUDED.badge_text,
    subtitle = EXCLUDED.subtitle,
    last_updated = EXCLUDED.last_updated,
    is_published = EXCLUDED.is_published,
    key_highlights = EXCLUDED.key_highlights,
    content = EXCLUDED.content,
    updated_at = now();

-- Document 2: Terms of Service
INSERT INTO public.legal_policies (
    slug,
    title,
    badge_text,
    subtitle,
    last_updated,
    is_published,
    key_highlights,
    content
) VALUES (
    'terms-of-service',
    'Terms of Service',
    'Legal Agreement',
    'Please read these Terms of Service carefully before accessing our website or engaging our creative, animation, branding, and web development services.',
    'September 19, 2026',
    true,
    '[
        {
            "icon": "Scale",
            "title": "Clear Project Scope",
            "description": "Agreed deliverables, milestones, and revision limits are transparently defined before work commences."
        },
        {
            "icon": "CheckCircle2",
            "title": "Deliverable Ownership",
            "description": "Full agreed final deliverables ownership transfers to you upon complete project payment."
        },
        {
            "icon": "FileText",
            "title": "Fair Revisions",
            "description": "Iterative revisions within scope ensure design excellence while keeping deadlines on track."
        },
        {
            "icon": "ShieldAlert",
            "title": "Confidentiality & Care",
            "description": "Your business ideas, briefs, and proprietary assets are treated with strict professional confidentiality."
        }
    ]'::jsonb,
    $terms_content$
### Welcome to IOE Creative Studio

These Terms of Service ("Terms") govern your access to and use of the IOE Creative Studio website and your engagement with our creative, design, animation, branding, web development, and related digital services.

By accessing our website, submitting an inquiry, requesting a quotation, purchasing a service, or engaging IOE Creative Studio for a project, you agree to these Terms.

**If you do not agree with these Terms, please do not use our website or engage our services.**

---

## 1. About IOE Creative Studio

IOE Creative Studio provides digital creative and technology services, which may include:

- Creative art and graphic design
- Logo and brand identity design
- Branding and visual identity systems
- Flyers, posters, social media graphics, and marketing materials
- Motion graphics
- Video and logo animation
- 2D and 3D animation
- Website design and development
- Full-stack web application development
- Digital product development
- AI-assisted creative and digital services
- Related consulting and digital services

*The specific services available may change over time.*

---

## 2. Website Use

You agree to use this website lawfully and responsibly.

**You must not:**
- Use the website for unlawful or fraudulent purposes.
- Attempt to gain unauthorized access to the website, admin systems, databases, or other infrastructure.
- Interfere with website security or functionality.
- Upload malicious code, malware, or harmful content.
- Misuse contact forms or communication channels.
- Impersonate another person or organization.
- Use our content, branding, or intellectual property without authorization.

We reserve the right to restrict or terminate access where necessary to protect the website, our clients, or our business.

---

## 3. Project Requests and Quotations

Submitting a project inquiry does not automatically create a binding service contract.

After reviewing a project request, we may provide a quotation, proposal, scope of work, or other project documentation.

A project becomes confirmed when the applicable project terms have been accepted and any required initial payment has been received.

Unless otherwise agreed in writing, quotations may have an expiration period specified in the quotation.

---

## 4. Scope of Work

The services and deliverables provided for a project will be based on the agreed scope.

**A project scope may include:**
- Specific deliverables
- Number and type of design concepts
- Number of revisions
- Project timeline
- Technical specifications
- Payment schedule
- Delivery format
- Hosting or deployment requirements
- Maintenance arrangements

Requests outside the agreed scope may require additional fees, time, or a separate agreement.

---

## 5. Client Responsibilities

Clients are responsible for providing accurate information, requirements, materials, approvals, and feedback reasonably necessary for the completion of their projects.

Where a client supplies content, the client represents that they have the necessary rights, permissions, and licenses to use that content.

**IOE Creative Studio is not responsible for delays caused by:**
- Late client feedback
- Missing information
- Delayed approvals
- Unavailable client materials
- Changes in project requirements
- Third-party services outside our reasonable control

---

## 6. Design Revisions

The number of revisions included in a project will depend on the agreed package or project scope.

A revision means a reasonable modification to an existing agreed concept or deliverable.

A completely new concept, substantial change of direction, or work outside the original scope may be treated as additional work and may attract an additional fee.

---

## 7. Website and Software Projects

For website and software development projects, the agreed scope determines the features, functionality, technologies, integrations, and deliverables included.

Additional features or functionality requested after approval of the scope may require additional charges.

Third-party services, hosting, domains, APIs, plugins, subscriptions, licenses, and other external services may involve separate costs unless expressly included in the project quotation.

---

## 8. Client Approval

Clients are responsible for reviewing and approving designs, content, functionality, and other deliverables before final delivery or publication.

Once a client approves a deliverable, subsequent changes may be treated as additional work where they fall outside the agreed revision allowance.

---

## 9. Payment

Project fees, deposits, milestones, balances, and payment schedules will be specified in the applicable quotation, proposal, package, invoice, or service agreement.

Unless otherwise agreed, work may begin after the required initial payment has been received.

For milestone-based projects, subsequent work or delivery may depend on payment of the applicable milestone.

Failure to make required payments may result in suspension or delay of the project.

---

## 10. Refunds and Cancellation

Refund eligibility depends on the nature and stage of the project and the terms agreed for that project.

Because creative and development services may involve time, resources, research, design work, development, and third-party costs, payments for work already completed may not be refundable.

Where a client cancels a project after work has started, the client may be responsible for payment for work already performed and non-refundable third-party costs incurred on the client's behalf.

Any specific refund or cancellation terms agreed in a signed proposal, quotation, or service agreement will take precedence for that project.

---

## 11. Intellectual Property

Unless otherwise agreed in writing, IOE Creative Studio retains ownership of its pre-existing tools, processes, templates, systems, source materials, reusable components, frameworks, techniques, and internal resources.

Ownership or licensing of final project deliverables will depend on the terms agreed for the specific project.

Where full ownership is transferred to the client after complete payment, the transfer applies only to the agreed final deliverables and does not automatically transfer IOE Creative Studio's pre-existing tools, reusable systems, third-party assets, fonts, software, or licensed materials.

Third-party materials remain subject to their respective licenses.

---

## 12. Client-Supplied Materials

Clients retain responsibility for materials they provide to IOE Creative Studio.

By providing images, videos, text, logos, documents, music, software, trademarks, or other materials, the client confirms that they have the necessary rights or permissions for the requested use.

The client agrees to indemnify IOE Creative Studio against claims arising directly from unauthorized materials supplied by the client, to the extent permitted by applicable law.

---

## 13. Portfolio and Promotion

Unless a project is subject to confidentiality restrictions or the parties have agreed otherwise, IOE Creative Studio may display completed work in its portfolio, website, social media, case studies, or promotional materials.

Clients may request confidentiality or restrictions on portfolio use before or during project engagement.

---

## 14. Third-Party Services

Some projects may depend on third-party services such as:
- Hosting providers
- Domain registrars
- Payment providers
- Cloud storage
- APIs
- Software platforms
- Plugins
- Fonts
- Stock media
- Communication platforms

IOE Creative Studio does not control third-party services and cannot guarantee their continuous availability, pricing, policies, or performance.

Third-party costs may be separate from IOE Creative Studio's service fees unless expressly included.

---

## 15. Website Hosting and Maintenance

Where hosting, maintenance, security updates, backups, technical support, or ongoing management are included in a service package, the specific terms will be stated in the applicable package or agreement.

Where these services are not included, ongoing hosting, maintenance, updates, or support may require a separate agreement or fee.

---

## 16. Artificial Intelligence and Digital Tools

IOE Creative Studio may use artificial intelligence and other digital tools as part of its creative or technical workflow where appropriate.

The use of such tools does not remove our responsibility to review and deliver work according to the agreed project requirements.

Where third-party AI or software services impose additional terms or restrictions, those terms may also apply.

---

## 17. Confidentiality

We will take reasonable steps to protect confidential information shared with us for the purpose of providing services.

Where a project requires specific confidentiality obligations, the parties may enter into a separate confidentiality or non-disclosure agreement.

---

## 18. Service Availability

We aim to provide reliable services and website availability, but we do not guarantee that the website or any service will always be uninterrupted, error-free, or continuously available.

Maintenance, technical problems, third-party outages, security events, or circumstances beyond our reasonable control may temporarily affect availability.

---

## 19. Limitation of Liability

To the extent permitted by applicable law, IOE Creative Studio will not be responsible for indirect, incidental, special, or consequential losses arising from the use of our website or services.

Our liability for a particular project will, where legally permissible, be limited to the amount paid to IOE Creative Studio for the specific service giving rise to the claim.

Nothing in these Terms excludes liability that cannot lawfully be excluded or limited.

---

## 20. Indemnification

To the extent permitted by law, you agree to indemnify and hold IOE Creative Studio harmless from claims, losses, liabilities, damages, and reasonable expenses arising from:
- Your unlawful use of our website or services.
- Materials you provide without the necessary rights or permissions.
- Your violation of these Terms.
- Your violation of applicable laws or third-party rights.

---

## 21. Termination

Either party may terminate a project or service in accordance with the applicable project agreement.

IOE Creative Studio may suspend or terminate access to the website or services where necessary due to misuse, non-payment, unlawful activity, security concerns, or material breach of these Terms.

Termination does not automatically eliminate payment obligations for work already completed or costs already incurred.

---

## 22. Disputes

We encourage clients to contact us first so that concerns can be discussed and resolved in good faith.

Where a dispute cannot be resolved informally, the parties may pursue the remedies available under applicable law and any dispute-resolution provisions contained in the applicable project agreement.

---

## 23. Governing Law

These Terms are intended to be governed by the applicable laws of the Federal Republic of Nigeria, subject to any mandatory legal requirements that may apply.

---

## 24. Changes to These Terms

We may update these Terms from time to time to reflect changes in our services, technology, business practices, or legal requirements.

The latest version will be published on this page with an updated "Last Updated" date.

Your continued use of the website after an updated version is published constitutes acceptance of the revised Terms to the extent permitted by law.

---

## 25. Contact Us

For questions regarding these Terms or our services, contact:

**IOE Creative Studio**
- **Email:** Igiharuwe7@gmail.com
- **Phone:** +234 704 649 4532
- **WhatsApp:** +234 904 005 9278

---

## 26. Acceptance of Terms

By using the IOE Creative Studio website or engaging our services, you acknowledge that you have read and understood these Terms of Service.

Project-specific agreements, quotations, proposals, invoices, or service agreements may contain additional terms applicable to a particular project. Where expressly agreed, those project-specific terms will govern the relevant project.
$terms_content$
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    badge_text = EXCLUDED.badge_text,
    subtitle = EXCLUDED.subtitle,
    last_updated = EXCLUDED.last_updated,
    is_published = EXCLUDED.is_published,
    key_highlights = EXCLUDED.key_highlights,
    content = EXCLUDED.content,
    updated_at = now();

-- Document 3: Client / Service Agreement
INSERT INTO public.legal_policies (
    slug,
    title,
    badge_text,
    subtitle,
    last_updated,
    is_published,
    key_highlights,
    content
) VALUES (
    'client-agreement',
    'Client / Service Agreement',
    'Official Engagement Contract',
    'Standard contractual framework governing customized creative design, motion graphics, branding, animation, and web application development engagements.',
    'September 19, 2026',
    true,
    '[
        {
            "icon": "FileCheck",
            "title": "Clearly Defined Scope",
            "description": "Deliverables, revision counts, milestones, and technical specifications are established before commencement."
        },
        {
            "icon": "ShieldCheck",
            "title": "Rights & Deliverables",
            "description": "Agreed final deliverables and usage rights transfer upon receipt of full project payment."
        },
        {
            "icon": "Clock",
            "title": "Milestone Timelines",
            "description": "Structured project phases with clear review periods to keep feedback, approvals, and launches on schedule."
        },
        {
            "icon": "Award",
            "title": "Studio Standards",
            "description": "Professional craftsmanship across graphic design, animation, branding, and full-stack web engineering."
        }
    ]'::jsonb,
    $agreement_content$
### IOE CREATIVE STUDIO — CLIENT / SERVICE AGREEMENT

**Effective Date / Last Updated:** September 19, 2026

This Client/Service Agreement ("Agreement") is between **IOE Creative Studio**, operated by **Igiharuwe Olayinka Emmanuel** ("IOE", "we", "us", or "our"), and the individual, business, organization, or entity engaging our services ("Client", "you", or "your").

This Agreement applies to a specific project or service requested by the Client and should be read together with the IOE Creative Studio Terms of Service and Privacy Policy.

---

## 1. PROJECT INFORMATION

Each project may be described in a quotation, proposal, invoice, order, project brief, or other written confirmation issued or approved by IOE.

**The project documentation may specify:**
- Client name and contact information
- Project or service name
- Description of the requested work
- Deliverables
- Quantity of deliverables
- Project timeline
- Number of revisions included
- Project fee
- Payment schedule
- Additional services or requirements
- Hosting, domain, maintenance, or other recurring services where applicable

The approved project documentation forms part of this Agreement.

---

## 2. SCOPE OF SERVICES

IOE will provide the services and deliverables specifically described in the approved project quotation, proposal, invoice, or project brief.

**Services may include, where applicable:**
- Graphic design
- Branding and logo design
- Social media graphics
- Motion graphics
- Video editing
- Logo and intro animation
- 2D/3D animation
- Website design and development
- Full-stack web application development
- UI/UX design
- Digital content creation
- AI-assisted creative services
- Website hosting and maintenance
- Other creative or digital services agreed in writing

Work outside the agreed scope may require an additional quotation or fee.

---

## 3. DELIVERABLES

IOE will provide the deliverables specifically identified in the approved project scope.

The final deliverables may include digital files, graphics, videos, websites, source files, documents, or other agreed materials.

**Unless expressly included in the project scope, the following are not automatically included:**
- Additional design concepts
- Additional pages or website features
- Additional revisions
- Source files
- Editable project files
- Premium fonts, stock assets, plugins, APIs, hosting, domains, or third-party subscriptions
- Ongoing maintenance
- Additional versions or formats

---

## 4. PROJECT TIMELINE

IOE will make reasonable efforts to complete projects within the agreed timeline.

**The timeline may depend on:**
- Receipt of required information and materials from the Client
- Timely feedback and approvals
- Payment of required fees
- Availability of required third-party services
- Changes to the agreed scope
- Technical issues outside IOE's reasonable control

If the Client delays providing required materials, information, feedback, approvals, or payments, the project deadline may be adjusted accordingly.

---

## 5. CLIENT RESPONSIBILITIES

**The Client agrees to provide accurate and timely:**
- Project information
- Text and written content
- Images, videos, logos, documents, and other materials
- Brand guidelines where applicable
- Account or access information where required
- Feedback and approvals
- Other information reasonably required to complete the project

The Client is responsible for ensuring that materials supplied to IOE may legally be used for the project.

---

## 6. DESIGN CONCEPTS AND REVISIONS

Where revisions are included, the number of included revisions will be stated in the approved project scope.

A revision means a reasonable modification to an existing concept or deliverable.

A request for a substantially different concept, new design direction, additional deliverable, or change outside the approved scope may be treated as additional work and may attract an additional fee.

The Client should provide consolidated and clear feedback where reasonably possible.

---

## 7. WEBSITE AND SOFTWARE PROJECTS

For website and software projects, the agreed scope should identify the features and functionality included in the project.

**Requests for additional functionality after approval of the scope may require:**
- Additional development time
- A revised quotation
- Additional payment
- A revised delivery date

Third-party services such as hosting providers, domains, payment gateways, APIs, plugins, cloud services, email services, maps, fonts, stock assets, or other external services may have their own fees and terms.

---

## 8. CLIENT REVIEW AND APPROVAL

The Client is responsible for reviewing submitted work and communicating any required changes within the agreed review period.

Once the Client approves a deliverable, subsequent changes may be treated as additional work.

For websites and applications, Client approval may include confirmation that the website or application has been reviewed and accepted for launch or delivery.

---

## 9. FEES AND PAYMENT

The project fee will be stated in the approved quotation, proposal, invoice, or order.

**Depending on the project, IOE may require:**
- Full payment before commencement
- An initial deposit
- Milestone payments
- Final payment before delivery or launch
- Recurring payments for hosting, maintenance, subscriptions, or other services

IOE may pause work where a required payment is outstanding. Payment does not automatically include third-party costs unless specifically stated.

---

## 10. LATE PAYMENT

Where a Client fails to make a required payment by the agreed deadline, IOE may suspend work until the outstanding amount is resolved.

Project timelines may be adjusted where work is suspended because of delayed payment.

Reasonable additional costs caused directly by prolonged payment delays may be charged where agreed or permitted by applicable law.

---

## 11. CANCELLATION AND REFUNDS

Cancellation terms will depend on the stage of the project and the work already performed.

Where work has already commenced, amounts relating to completed work, purchased third-party assets, committed resources, or other non-recoverable costs may not be refundable.

Any refund will be handled in accordance with the applicable quotation, payment terms, and IOE Terms of Service.

---

## 12. INTELLECTUAL PROPERTY

**Unless otherwise agreed in writing, IOE retains ownership of its pre-existing:**
- Templates
- Design systems
- Reusable components
- Development frameworks
- Code libraries
- Processes
- Tools
- Methods
- General know-how

Upon receipt of full payment, ownership or usage rights for the specifically commissioned final deliverables will be transferred or granted to the Client according to the project agreement.

Where source files or editable files are included, they will be delivered according to the agreed scope.

---

## 13. CLIENT-SUPPLIED MATERIALS

**The Client retains responsibility for materials supplied to IOE, including:**
- Logos
- Images
- Videos
- Text
- Documents
- Trademarks
- Brand assets
- Other copyrighted materials

The Client confirms that it has the necessary rights or permission to provide those materials for use in the project.

The Client agrees to protect IOE against claims arising from unauthorized use of materials supplied by the Client, to the extent permitted by applicable law.

---

## 14. THIRD-PARTY ASSETS AND SERVICES

**Projects may use third-party resources such as:**
- Stock images
- Fonts
- Icons
- Plugins
- APIs
- Software libraries
- Hosting services
- Cloud storage
- Payment providers
- AI tools
- Other external services

Third-party resources may have separate licenses, fees, limitations, and terms.

Where a third-party subscription or license is required, the Client may be responsible for the applicable cost unless otherwise agreed.

---

## 15. HOSTING, DOMAIN AND MAINTENANCE

Website hosting, domain registration, maintenance, updates, backups, security monitoring, and technical support are separate services unless specifically included in the approved project scope.

Where IOE manages hosting or maintenance for the Client, the applicable service period and fees will be stated separately.

---

## 16. AI-ASSISTED SERVICES

IOE may use artificial intelligence and other digital tools to assist with certain creative, development, research, editing, production, or workflow processes.

AI-assisted work remains subject to human review and project requirements.

Where third-party AI tools are used, their availability, limitations, licenses, and terms may apply.

AI-assisted production does not guarantee that every generated element will be unique or free from similarities to other generated content.

---

## 17. CONFIDENTIALITY

IOE will take reasonable steps to protect confidential project information provided by the Client. The Client should identify information that is specifically confidential where appropriate.

**Confidentiality obligations do not generally apply to information that:**
- Is publicly available
- Was already lawfully known
- Becomes publicly available without breach of this Agreement
- Is independently developed
- Must be disclosed by law or lawful authority

---

## 18. PORTFOLIO AND PROMOTIONAL USE

Unless otherwise agreed in writing, IOE may display completed work in its portfolio, website, social media, presentations, or promotional materials after the work has been publicly released.

Where a Client requires confidentiality or does not want a project publicly displayed, the Client should notify IOE before project completion or agree to specific restrictions in writing.

---

## 19. PROJECT DELAYS

IOE will make reasonable efforts to meet agreed deadlines.

**IOE will not be responsible for delays caused by circumstances reasonably outside its control, including:**
- Client delays
- Delayed approvals
- Third-party service outages
- Hosting problems
- Internet or infrastructure failures
- Government restrictions
- Natural disasters
- Security incidents
- Other events beyond reasonable control

Where practical, IOE will communicate significant delays to the Client.

---

## 20. PROJECT TERMINATION

Either party may request termination of a project in accordance with the applicable project agreement.

If a project is terminated after work has commenced, the Client may remain responsible for fees relating to work already completed, approved expenses, third-party costs, and other obligations incurred before termination.

Where appropriate, IOE may provide completed deliverables after outstanding payments have been settled.

---

## 21. ACCEPTANCE OF DELIVERABLES

**A deliverable will generally be considered accepted when the Client:**
- Expressly approves it;
- Uses or publishes it;
- Confirms acceptance in writing; or
- Fails to raise reasonable objections within an agreed review period.

Acceptance does not prevent the Client from exercising any rights that cannot legally be excluded.

---

## 22. DISPUTE RESOLUTION

The parties will first attempt to resolve project disputes through good-faith communication.

Where a dispute cannot be resolved informally, the parties may use an appropriate dispute-resolution process before pursuing further legal remedies, where applicable.

---

## 23. GOVERNING TERMS

This Agreement should be read together with the IOE Creative Studio Terms of Service and Privacy Policy.

Where a project-specific quotation, proposal, or signed agreement contains terms specifically applicable to that project, those project-specific terms will apply to the extent of any inconsistency.

Nothing in this Agreement is intended to remove any rights or protections that cannot legally be excluded.

---

## 24. CHANGES TO THE PROJECT

Any material change to the project scope should be confirmed in writing.

**Changes may affect:**
- Project price
- Deliverables
- Timeline
- Number of revisions
- Technical requirements
- Hosting or maintenance requirements

IOE may issue a revised quotation or change order before carrying out substantial additional work.

---

## 25. ENTIRE PROJECT AGREEMENT

The approved project quotation, proposal, invoice, project brief, change orders, and this Agreement may together constitute the agreement governing the specific project.

If a separate written agreement is signed for a project, that agreement will govern where its terms conflict with this general Client/Service Agreement.

---

## 26. CLIENT ACCEPTANCE

By approving a quotation, making the required project payment, signing this Agreement, or otherwise authorizing IOE to commence the project, the Client confirms that the Client has had an opportunity to review the applicable project terms and agrees to them.

---

## 27. CONTACT

**IOE Creative Studio**
- **Representative:** Igiharuwe Olayinka Emmanuel
- **Email:** Igiharuwe7@gmail.com
- **Phone:** +234 704 649 4532
- **WhatsApp:** +234 904 005 9278
- **Tagline:** Elevating Brands through Creative Design & Digital Innovation

---

## 28. SIGNATURE / APPROVAL

Both parties acknowledge and agree to the terms set forth in this Client / Service Agreement by affixing their signatures below or completing electronic approval:

### Client Execution Details:
- **Client Name:** ___________________________
- **Company / Organization:** ___________________________
- **Email:** ___________________________
- **Phone:** ___________________________
- **Signature:** ___________________________
- **Date:** ___________________________

### IOE Creative Studio Execution Details:
- **Representative:** Igiharuwe Olayinka Emmanuel
- **Role / Title:** Creative Lead & Principal Engineer
- **Email:** Igiharuwe7@gmail.com
- **Phone / WhatsApp:** +234 704 649 4532 / +234 904 005 9278
- **Signature:** *Igiharuwe O. Emmanuel*
- **Date:** September 19, 2026
$agreement_content$
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    badge_text = EXCLUDED.badge_text,
    subtitle = EXCLUDED.subtitle,
    last_updated = EXCLUDED.last_updated,
    is_published = EXCLUDED.is_published,
    key_highlights = EXCLUDED.key_highlights,
    content = EXCLUDED.content,
    updated_at = now();

-- 10. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
