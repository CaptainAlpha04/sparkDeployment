/**
 * Renders a JSON-LD block.
 *
 * The escaping is not decoration. JSON.stringify happily emits the sequence
 * `</script>` inside a string value, and the HTML parser ends the script there
 * regardless of the JSON — a post whose body quoted a script tag would break
 * every tag after it on the page. Escaping `<` closes that.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // The content is ours, generated from the database, never user HTML.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
