use std::{collections::HashMap, str::FromStr};

use anlg_frontmatter::{Document, Error};

#[derive(Debug, Clone, PartialEq)]
pub(super) struct ParsedDocument {
    pub frontmatter: HashMap<String, serde_json::Value>,
    pub content: String,
}

impl FromStr for ParsedDocument {
    type Err = Error;

    fn from_str(source: &str) -> Result<Self, Self::Err> {
        match Document::<HashMap<String, serde_yaml::Value>>::from_str(source) {
            Ok(document) => Ok(Self {
                frontmatter: document
                    .frontmatter
                    .into_iter()
                    .map(|(key, value)| {
                        let value = serde_json::to_value(value).unwrap_or(serde_json::Value::Null);
                        (key, value)
                    })
                    .collect(),
                content: document.content,
            }),
            Err(Error::MissingOpeningDelimiter) => Ok(Self {
                frontmatter: HashMap::new(),
                content: source.to_owned(),
            }),
            Err(error) => Err(error),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_frontmatter_without_the_file_sync_crate() {
        let parsed = ParsedDocument::from_str("---\ntitle: Local note\n---\nBody").unwrap();

        assert_eq!(parsed.frontmatter["title"], "Local note");
        assert_eq!(parsed.content, "Body");
    }

    #[test]
    fn accepts_plain_markdown() {
        let source = "# Local note\n\nBody";
        let parsed = ParsedDocument::from_str(source).unwrap();

        assert!(parsed.frontmatter.is_empty());
        assert_eq!(parsed.content, source);
    }
}
