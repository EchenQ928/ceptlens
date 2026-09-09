import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="two-paths" title="先看清两条路径">
        <CuratedVisual name="residual-path-visual" />
        <Formula expression="y=F(x;\\theta)+x" symbols={[{"symbol":"x","meaning":"同时进入主支路和 shortcut 的输入"},{"symbol":"F(x;\\theta)","meaning":"由参数 θ 控制的主支路变换"},{"symbol":"y","meaning":"两条支路逐元素相加后的输出"}]} />
      </TermSection>
      <TermSection id="why-it-helps" title="为什么深层网络更容易训练">
        <Paragraph>{"如果新增层暂时学不到有用变换，主支路 F(x) 可以接近 0，整个模块仍能近似把 x 传下去。[[term:backpropagation|反向传播]]时，加法节点也给梯度提供一条不经过主支路内部所有运算的直接路径。"}</Paragraph>
        <Formula expression="\\frac{\\partial y}{\\partial x}=\\frac{\\partial F(x;\\theta)}{\\partial x}+I" symbols={[{"symbol":"\\partial F/\\partial x","meaning":"梯度经过主支路时产生的变化"},{"symbol":"I","meaning":"shortcut 带来的恒等直达项"}]} />
        <Callout tone="key" title="不是保证梯度永不消失">{"残差连接改善深层信息和梯度传播条件，但整体训练仍受初始化、归一化、激活函数和数值精度等因素影响。"}</Callout>
      </TermSection>
      <TermSection id="shape" title="两路什么时候能相加">
        <Comparison columns={["两路形状","处理方式","常见场景"]} rows={[["完全相同","直接逐元素相加","Transformer Block、同宽 ResNet Block"],["通道数不同","shortcut 使用 1×1 卷积或线性投影对齐","CNN 扩宽通道"],["空间尺寸不同","shortcut 同步下采样后再相加","CNN 切换阶段"],["无法按语义对齐","不能把广播凑形状当成残差连接","需要重新检查结构设计"]]} />
      </TermSection>
      <EngineeringBoundaries items={["shortcut 张量必须一直保留到加法发生，因此它的生命周期会影响峰值内存；编译器可能融合加法与相邻算子，但不能凭结构图假定零开销。","量化部署中，两路张量的 scale 或 zero-point 不一致时需要重定标或支持双输入尺度的加法内核。"]} />
    </div>;
}

export default defineTermView({ termId: "residual-connection", Component: TermBody });
