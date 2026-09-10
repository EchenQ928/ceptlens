import { Callout, CodeBlock, Comparison, CuratedVisual, DepthwiseConvolutionExplorer, EngineeringBoundaries, Flow, Formula, Paragraph, TermSection, defineTermView } from "@term-sdk";
import styles from "./styles.module.css";

function TermBody() {
  return <div className={styles.packageRoot}>
      <TermSection id="three-regimes" title="先分清[[term:underfitting|欠拟合]]、合理拟合和过拟合">
        <Paragraph>{"模型太简单时，连训练数据的主要规律都学不会，是欠拟合；模型复杂度与数据匹配时，训练和验证表现都较好；模型继续追随训练细节而验证表现恶化时，才是过拟合。"}</Paragraph>
        <CuratedVisual name="fitting-regimes-visual" />
      </TermSection>
      <TermSection id="evidence" title="用什么证据判断">
        <Flow steps={[{"label":"训练集更新参数","detail":"优化器根据训练数据产生的损失和梯度修改模型。"},{"label":"验证集独立观察","detail":"验证数据不参与本轮参数更新，用来观察模型对未见样本的表现。"},{"label":"比较变化趋势","detail":"训练损失下降而验证损失持续上升，或两者差距明显扩大，是典型信号。"}]} />
        <Callout tone="key" title="最佳权重不一定是最后一个 Epoch">{"如果验证指标在中途达到最好、之后开始恶化，应保存并使用验证表现最好的检查点，而不是默认使用最后一次训练的权重。"}</Callout>
      </TermSection>
      <TermSection id="causes-actions" title="常见原因与处理方向">
        <Comparison columns={["现象来源","为什么会过拟合","常用处理"]} rows={[["数据少或覆盖窄","模型很容易记住有限样本","补充有效数据、数据增强、交叉验证"],["模型相对任务过复杂","自由度远高于可支撑的数据量","减小模型、[[term:regularization|正则化]]、早停"],["训练过久","后期继续拟合噪声和偶然细节","监控验证曲线并早停"],["训练/部署分布不一致","训练规律无法迁移到真实输入","重新划分数据并覆盖真实场景"]]} />
      </TermSection>
      <EngineeringBoundaries items={["只有训练指标与独立数据指标之间的差距，才能支持过拟合判断；单看训练损失很低不能得出结论。","验证集被反复用于大量调参后，也会产生对验证集的间接过拟合；最终结论仍需独立测试集或真实平台数据。"]} />
    </div>;
}

export default defineTermView({ termId: "overfitting", Component: TermBody });
