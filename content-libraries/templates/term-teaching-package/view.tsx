import { EngineeringBoundaries, Paragraph, TermSection, VisualFrame, defineTermView, uiText, useLocale } from "@term-sdk";

function TermBody() {
  const { locale } = useLocale();
  const t = (zhCN: string, enUS: string) => uiText(locale, zhCN, enUS);
  return <><TermSection id="mechanism" title={t("输入如何变成输出", "How input becomes output")}><Paragraph>{t("先用完整自然语言讲清概念，再出现图、公式或控件。正文中的 [[term:prerequisite-id|前置概念]] 由作者决定是否链接。", "Explain the concept in complete natural language before showing a figure, formula, or control. The author decides whether to link [[term:prerequisite-id|prerequisite concepts]] in the text.")}</Paragraph><VisualFrame title={t("只回答一个明确问题", "Answer one clear question")}><p>{t("在这里放最适合本词条的静态图或交互；不需要时可以直接删除整个 VisualFrame。", "Put the static figure or interaction that best fits this term here; delete the entire VisualFrame when it is not needed.")}</p></VisualFrame></TermSection><EngineeringBoundaries items={[t("写清适用场景、不适用场景以及必要的数值或硬件边界。", "State the valid and invalid use cases and any necessary numerical or hardware boundaries.")]}/></>;
}

export default defineTermView({ termId: "term-unique-id", Component: TermBody });
