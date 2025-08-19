const aliases = new Map([['className', 'class']]);

export default function getAlias(name) {
  return aliases.get(name) || name;
}
