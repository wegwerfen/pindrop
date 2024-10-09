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

export const IMAGE_ANALYSIS_PROMPT = `Analyze the provided image and generate a detailed description of its content. Include key objects, colors, and themes. After the description, suggest up to 6 tags that summarize the main elements, topics, or objects in the image. Provide the output in the following JSON formatonly. Do not include any Markdown syntax, code blocks, or additional text.
Format:
{
  "description": "Your description here.",
  "tags": ["tag1", "tag2", "tag3"]
}
Image Data:
`;
export const NOTE_ANALYSIS_PROMPT = `Give a short, one paragraph summary of the following note, suggest a title for the note, and suggest a maximum of 6 tags for the note. Use the following format:
{
"summary": "",
"title": "",
"tags": [
"",
"",
"",
"",
""
]
}

text:`;