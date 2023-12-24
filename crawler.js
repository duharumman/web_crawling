const { load } = require("cheerio")

const fs = require("fs/promises")
const os = require("os")

const pageUrl = "https://scrapeme.live/shop";

async function crawlPage(pageUrl){
    const baseURL = "https://scrapeme.live/"; 
    
    const response = await fetch(pageUrl);
    const html_data = await response.text();
    const $ = load(html_data);
    const discoveredHTMLAElements = $("a[href]");

    const discoveredLinks = []
    discoveredHTMLAElements.each((_,a) =>{
        discoveredLinks.push($(a).attr("href"))
    })

    const filteredDiscoveredURLs = discoveredLinks.filter(
        (url)=>{
            return(
                url.startsWith(baseURL) &&
                (!url.startsWith(`${baseURL}/wp-admin`) ||
                    url === `${baseURL}/wp-admin/admin-ajax.php`
                )
            )
        }
    )
    return(filteredDiscoveredURLs);
}

async function crawlSite(){
    const pagesToCrawl = [pageUrl]
    const pagesCrawled = []
    const discoveredURLs = new Set()
    
    while(pagesToCrawl.length > 0 &&
            discoveredURLs.size <= 200
        ){

        const currentPage = pagesToCrawl.pop();
        const pageDiscoveredURLs = await crawlPage(currentPage);
        pageDiscoveredURLs.forEach(url => {
            discoveredURLs.add(url);
            if( !pagesCrawled.includes(url) &&
                url !== currentPage ){
                    pagesToCrawl.push(url);
                }
        });
        pagesCrawled.push(currentPage)
        console.log(
            `${discoveredURLs.size} URLs discovered so far`
        )
        // console.log(`${pageDiscoveredURLs.length} URLs found`)
    }

    const csvContent = [...discoveredURLs].join(os.EOL);
    
    // export the CSV string to an output file
    await fs.writeFile("output.csv",csvContent);
}

crawlSite()