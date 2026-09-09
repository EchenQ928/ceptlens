import { EngineeringBoundaries, Paragraph, TermSection, VisualFrame, defineTermView } from "@term-sdk";

function TermBody() {
  return <><TermSection id="mechanism" title="输入如何变成输出"><Paragraph>{"先用完整自然语言讲清概念，再出现图、公式或控件。正文中的 [[term:prerequisite-id|前置概念]] 由作者决定是否链接。"}</Paragraph><VisualFrame title="只回答一个明确问题"><p>在这里放最适合本词条的静态图或交互；不需要时可以直接删除整个 VisualFrame。</p></VisualFrame></TermSection><EngineeringBoundaries items={["写清适用场景、不适用场景以及必要的数值或硬件边界。"]} /></>;
}

export default defineTermView({ termId: "term-unique-id", Component: TermBody });
