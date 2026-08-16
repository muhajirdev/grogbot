export function FaqList(props: { items: Array<{ q: string; a: string }> }) {
  return (
    <div className="faqs">
      {props.items.map((item) => (
        <details key={item.q} className="faq">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function BulletList(props: { items: string[] }) {
  return (
    <ul className="points">
      {props.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
