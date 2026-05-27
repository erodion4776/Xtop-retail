import dns from 'dns/promises';

export async function checkDomains(domain: string) {
  const results = {
    spfStatus: false,
    dkimStatus: false,
    dmarcStatus: false,
    overall: false,
  };

  try {
    const txtRecords = await dns.resolveTxt(domain);
    const allRecords = txtRecords.flat().join(' ');
    
    // Check SPF
    if (allRecords.includes('v=spf1') && allRecords.includes('resend.com')) {
      results.spfStatus = true;
    }

    // Check DKIM (simulated check as real DKIM needs selector)
    if (allRecords.includes('k=rsa') || allRecords.includes('v=DKIM1')) {
        results.dkimStatus = true;
    }

    // Check DMARC
    try {
      const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`);
      const dmarcVal = dmarcTxt.flat().join(' ');
      if (dmarcVal.includes('v=DMARC1')) {
        results.dmarcStatus = true;
      }
    } catch {}

    results.overall = results.spfStatus && results.dkimStatus && results.dmarcStatus;
  } catch (err) {
    console.error(`DNS check failed for ${domain}:`, err);
  }

  return results;
}
