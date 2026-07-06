# Backend / Distributed-Systems H-1B Sponsor Filter

**Source (verified, local):** `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv`

**Filter (verified, deterministic):** industry in ['Computers', 'Manufacturing', 'Other Banking and Financial Services', 'Other Technology']; funding stage in ['Series A', 'Series B', 'Series C']; Total Approvals >= 2.0; top_job_titles_sponsored contains one of ['backend', 'back-end', 'back end', 'distributed', 'platform', 'infrastructure', 'site reliability', 'sre', 'systems engineer', 'software engineer', 'data engineer']

**Known dataset limitation (verified by inspection):** this CSV is sourced from SEC Form D, which covers private securities offerings only. It contains no field that identifies publicly traded companies, so this filter cannot include Sid's "public/established company" target segment -- that requires a separate data source (e.g. an equities/EDGAR 10-K feed), logged as a [TODO: DATA SOURCE] in the mode file.

Rows scanned: 30369 | Rows with any H-1B data: 1557 | Rows matching all filters: 219

| Company | Industry | Funding Stage | Approvals | Approval Rate | Median Salary | Sponsored Titles (raw) |
|---|---|---|---|---|---|---|
| INTEL CORP | Other Technology | Series B | 13318.0 | 97.32534346682256 | 115898.0 | ['Component Design Engineer', 'Software Engineer', 'Process Engineer', 'Engineering Manager', 'Product Engineer'] |
| HUMAN INC | Other Technology | Series B | 1382.0 | 99.13916786226686 | 132078.08875 | ['Senior Emerging Technology Engineer', 'Process Improvement Lead', 'Senior Software Engineer', 'Senior Full Stack Engin |
| DOCUSIGN INC | Other Technology | Series B | 1082.0 | 98.90310786106032 | 172107.0 | ['Software Engineer', 'Sr. Software Engineer', 'Sr. Program Manager', 'Principal Software Engineer', 'Data Engineer', 'S |
| AIRBNB INC | Other Technology | Series B | 1000.0 | 99.009900990099 | 158080.0 | ['Software Engineer', 'Senior Software Engineer', 'Data Scientist', 'Senior Data Scientist', 'Engineering Manager'] |
| PURE STORAGE INC | Other Technology | Series C | 822.0 | 99.27536231884058 | 184454.0 | ['Member of Technical Staff (Software Engineer)', 'Member of Technical Staff (Software Engineer) ', 'Member of Technical |
| ZSCALER INC | Other Technology | Series B | 802.0 | 98.52579852579852 | 141378.0 | ['Software Engineer', 'Senior Product Manager', 'Senior Software Engineer', 'Senior Software Engineer ', 'Staff Software |
| ARISTA NETWORKS INC | Other Technology | Series A | 702.0 | 97.5 | 119983.0 | ['Software Engineer', 'Software Engineer ', 'Technical Solutions Engineer', 'POC Engineer', 'Technical Solutions Enginee |
| ROKU INC | Other Technology | Series C | 654.0 | 99.3920972644377 | 182155.0 | ['Senior Software Engineer', 'Senior Data Scientist', 'Software Engineer', 'Product Manager', 'Senior Data Engineer'] |
| CONFLUENT INC | Other Technology | Series C | 610.0 | 100.0 | 165000.0 | ['Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer', 'Sr. Business Systems Analyst - GTM', 'Seni |
| MONGODB INC | Computers | Series C | 462.0 | 99.14163090128756 | 159609.0 | ['Senior Software Engineer', 'Software Engineer ', 'Senior Product Manager', 'Marketing Analytics and Operations Manager |
| REMITLY INC | Other Banking and Financial Services | Series C | 344.0 | 98.85057471264368 | 145274.0 | ['SENIOR ANALYST, MARKETING ANALYTICS', 'Senior Software Development Engineer', 'Software Engineer', 'Senior IT Auditor' |
| DATADOG INC | Other Technology | Series C | 340.0 | 100.0 | 181000.0 | ['Software Engineer II', 'Senior Software Engineer', 'Software Engineer', 'Privacy Counsel', 'PRODUCT MANAGER'] |
| COGNIZER INC | Other Technology | Series A | 328.0 | 97.61904761904762 | 99008.0 | ['Software Developer', 'SOFTWARE DEVELOPER', 'Software Engineer', 'QA ANALYST', 'CLOUD ENGINEER'] |
| QUANTIPHI INC | Other Technology | Series A | 270.0 | 95.74468085106383 | 125660.0 | ['Engagement Manager', 'Senior Conversation Bot Engineer', 'Senior Data Engineer', 'Senior Machine Learning Engineer', ' |
| YELP INC | Other Technology | Series C | 244.0 | 99.1869918699187 | 175000.0 | ['Software Engineer', 'Engineering Manager', 'Software Engineer ', 'Group Product Manager', 'Senior Director, Business O |
| SMARTSHEET INC | Other Technology | Series B | 240.0 | 99.17355371900828 | 145000.0 | ['SENIOR SOFTWARE ENGINEER I', 'SOFTWARE ENGINEER II', 'SENIOR SOFTWARE ENGINEER II', 'MANAGER, ENGINEERING', 'SENIOR PR |
| SERVICETITAN INC | Other Technology | Series B | 238.0 | 98.34710743801654 | 162500.0 | ['Staff Quality Automation Engineer', 'Senior Quality Automation Engineer', 'Senior Manager, Product Strategy', ' Senior |
| ETSY INC | Other Technology | Series A | 222.0 | 99.10714285714286 | 186150.0 | ['Senior Software Engineer I, Machine Learning', 'Senior Software Engineer II', 'Senior Product Manager, Search Matching |
| COUPA SOFTWARE INC | Other Technology | Series C | 214.0 | 96.3963963963964 | 140000.0 | ['Lead Software Engineer', 'Product Manager', 'Sr. Value Solutions Consultant', 'Principal Technical Writer', 'Sr. Manag |
| AURORA INNOVATION INC | Other Technology | Series C | 212.0 | 99.06542056074768 | 189000.0 | ['Senior Software Engineer', 'Software Engineer II', 'SOFTWARE ENGINEER II', 'Staff Software Engineer', 'SOFTWARE ENGINE |
| ASTERA LABS INC | Other Technology | Series B | 208.0 | 100.0 | 180000.0 | ['Senior Principal Design Verification Engineer', 'Product applications engineer ', 'Senior Product Applications Enginee |
| RIPPLE LABS INC | Other Technology | Series C | 200.0 | 99.009900990099 | 150935.0 | ['Software Engineer', 'Senior Software Engineer', 'Senior Product Manager', 'Growth and Digital Marketer', 'Senior Softw |
| KIZEN TECHNOLOGIES INC | Other Technology | Series B | 188.0 | 98.94736842105264 | 80000.0 | ['Computer Systems Engineer ', 'Computer Systems Engineer', 'Senior Programmer Analyst ', 'Compliance Auditor ', 'Logist |
| VERSA NETWORKS INC | Other Technology | Series C | 164.0 | 98.79518072289156 | 178495.5 | ['Software Test Engineer', 'Sr. Network Architect', 'Software Engineer', 'Network Architect', 'Information Systems Direc |
| HEALTHEDGE SOFTWARE INC | Other Technology | Series B | 156.0 | 97.5 | 121546.5 | ['Technical Services Engineer (Deep Dive Team)', 'Senior Software Engineer', 'Senior Data Integration Analyst', 'Softwar |
| TOAST INC | Other Technology | Series B | 150.0 | 97.4025974025974 | 177341.0 | ['Senior Software Engineer', 'Senior Credit Risk Analyst', 'Staff Software Engineer/Team Lead Manager', 'Senior Systems  |
| SITE TECHNOLOGIES INC | Other Technology | Series A | 148.0 | 98.66666666666669 | 83096.0 | ['Business Analyst', 'Product Owner', 'Oracle Consultant', 'Software Engineer', 'Full Stack Developer'] |
| FORMATION DATA SYSTEMS INC | Other Technology | Series A | 130.0 | 91.54929577464787 | 88400.0 | ['Devops Engineer', 'Software Developer', 'Software Quality Assurance Analyst and Tester', 'Data Engineer', 'Software En |
| AVALARA INC | Other Technology | Series C | 128.0 | 98.46153846153848 | 150800.0 | ['Senior Applications Engineer', 'Site Reliability Engineer', 'Senior Strategic Alliance Manager', 'Applications Enginee |
| DISCORD INC | Other Technology | Series B | 122.0 | 100.0 | 218000.0 | ['Senior Software Engineer', 'Software Engineer', 'Software Engineer, Machine Learning', 'Product Manager', 'Engineering |
| SECURONIX INC | Other Technology | Series A | 122.0 | 98.38709677419357 | 97333.5 | ['Senior UX Designer', 'Principal Cloud Architect', 'Platform Solutions Architect', 'Technical Account Manager', 'Techni |
| CLARI INC | Other Technology | Series B | 116.0 | 100.0 | 189155.0 | ['Principal Product Growth Strategist', 'Senior Software Engineer', 'Senior Data Scientist', 'Senior Software Test Engin |
| TRACELINK INC | Other Technology | Series C | 112.0 | 96.55172413793105 | 139550.0 | ['Senior Software Engineer', 'Senior Technical Product Manager', 'Software Engineer in Test III', 'Software Engineer in  |
| COHERE HEALTH INC | Other Technology | Series C | 104.0 | 98.1132075471698 | 160000.0 | ['Engineering Manager ', 'Senior Software Engineer, Platform', 'Senior Machine Learning DevOps Engineer', 'Software Engi |
| LIFE360 INC | Other Technology | Series B | 102.0 | 100.0 | 185000.0 | ['DevOps Engineer II', 'Senior Software Engineer', 'Senior Manager, Revenue', 'Staff Software Engineer', 'Software Engin |
| FLATIRON HEALTH INC | Other Technology | Series A | 98.0 | 100.0 | 179610.97999999998 | ['Senior Quantitative Scientist', 'Senior Software Engineer', 'Security Engineer', 'Senior Site Reliability Engineer'] |
| DATASTAX INC | Other Technology | Series B | 94.0 | 100.0 | 157477.0 | ['Software Engineer', 'Escalations Engineer', 'Software Engineer - Data Platform'] |
| IRONCLAD INC | Other Technology | Series B | 94.0 | 100.0 | 167500.0 | ['Senior Director, Engineering', 'Staff Software Engineer', 'Solutions Architect', 'Software Engineer'] |
| JUSTWORKS INC | Other Technology | Series B | 80.0 | 97.5609756097561 | 215000.0 | ['Senior Software Engineer', 'Senior Product Manager, PTU', 'Staff Security Engineer', 'Senior Engineering Manager, Grow |
| THOUGHTSPOT INC | Other Technology | Series C | 76.0 | 100.0 | 141232.0 | ['Software Engineer', 'Staff Software Engineer - Machine Learning', 'Sales Engineer', 'Solutions Architect', 'Senior MTS |
