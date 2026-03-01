const FACTS: string[] = [
  'The first recorded pie & mash shop opened in London in the early 19th century, making it one of the city\'s oldest fast-food traditions.',
  'Liquor sauce gets its name not from alcohol, but from the liquid used when boiling the eels that were once served alongside.',
  'Manze\'s on Tower Bridge Road has been serving pie and mash since 1902, making it one of the oldest continuously operating shops.',
  'Traditional pies use a "hot water crust" pastry — made by adding boiling water to flour — which creates a sturdy, hand-raised shell.',
  'Jellied eels were the original companion to pie and mash, beloved by East London\'s working-class communities in the 1800s.',
  'The bright green liquor sauce is simply a parsley sauce — made from fresh parsley blended with the water from poaching eels.',
  'Pie and mash became a staple cheap meal for London\'s dockworkers and market traders during the Industrial Revolution.',
  'Most traditional shops still use marble-top tables and wooden benches, a design unchanged since Victorian times.',
  'The eels used in traditional shops were historically caught from the Thames, though today they mainly come from Dutch and Danish rivers.',
  'A proper pie should have pastry on the bottom and sides as well as the top — a full shell, not just a lid.',
  'The tradition of eating pie and mash with a fork and spoon — spoon for liquor, fork for everything else — dates back generations.',
  'Cold jellied eels set using a natural gelatin produced by boiling the eels — no extra setting agent is needed.',
  'Chilli vinegar is the traditional condiment sprinkled liberally over a plate of pie and mash.',
  'Many old pie and mash shops have been awarded Grade II listed building status to protect their original Victorian interiors.',
  'The eel pie was historically more common than the beef pie — Thames eels were cheaper than beef for centuries.',
  'At its peak in the early 20th century, there were over 150 pie and mash shops across London.',
  'Today fewer than 30 traditional pie and mash shops remain open in London, though the tradition is experiencing a revival.',
  'L. Manze and M. Manze are run by descendants of the same Italian immigrant family — Michele Manze, who arrived from Ravello in the 1890s.',
  'Some modern shops now offer vegetarian fillings — typically minced quorn or vegetables — while keeping the traditional pastry and liquor.',
  'The white porcelain plates used in pie and mash shops are often oven-safe, serving as both baking and eating vessels.',
  'Pie and mash is closely associated with Cockney culture, referenced in rhyming slang and music hall songs from the Victorian era.',
  'Rock eels — actually dogfish, not true eels — are sometimes sold as a cheaper alternative at less traditional seafood stalls.',
  'An eel farm in Essex is one of the few domestic suppliers still providing live eels to London\'s traditional shops.',
  'The liquor sauce is traditionally made from eel poaching liquid, fresh parsley, and a little cornflour to give it body.',
  'The revival of "nose-to-tail" eating and British heritage food has helped bring new attention to pie and mash culture.',
  'Traditional shops weigh and price their mash by the scoop — you can usually order one, two, or three portions.',
  'Pie and mash shops were among the first takeaway food establishments in London, predating fish and chip shops by decades.',
  'The minced beef filling in a traditional pie is seasoned simply — just salt, pepper, and sometimes a little onion.',
  'Some pie and mash families have kept their pastry and liquor recipes secret for four or five generations.',
  'The number of regular pie and mash shops in London roughly halved between 1970 and 2000 as eating habits changed.',
];

/** Returns a fact that rotates daily based on the day of the year. */
export function getDailyFact(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return FACTS[dayOfYear % FACTS.length];
}
