// export const WEBPAGE_ANALYSIS_PROMPT = `Give a short, one paragraph summary of the following website text, classify the website as either a website or an article, and provide 5 tags for the website in the following format:
// {
// "summary": "",
// "classification": "",
// "tags": [
// "",
// "",
// "",
// "",
// ""
// ]
// }

// text:`;

export const WEBPAGE_ANALYSIS_PROMPT = `Give a short, one paragraph summary of the following website text, classify the website as either a website or an article, and provide a maximum of 15 tags for the website. For shorter or more focused content, aim for the lower end (5-8 tags) and For longer or more comprehensive content, you might go up to 10-15 tags. Use the following format:
{
"summary": "",
"classification": "",
"tags": [
"",
"",
"",
"",
""
]
}

text:`;
// Add more prompts here as needed