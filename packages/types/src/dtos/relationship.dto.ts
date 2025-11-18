/**
 * 用語間の関係性を作成するためのDTO
 *
 * UML関係性モデルに基づいて、2つの用語間の関係を定義します。
 */
export interface CreateRelationshipDto {
  /** 関係の始点となる用語ID（必須） */
  sourceTermId: string;
  /** 関係の終点となる用語ID（必須） */
  targetTermId: string;
  /** 関係の種類（必須）。集約、関連、依存、継承のいずれか */
  relationshipType: 'aggregation' | 'association' | 'dependency' | 'inheritance';
  /** 関係についての詳細説明 */
  description?: string;
}

/**
 * ダイアグラムを描画するためのデータ構造
 *
 * 用語とその関係性をグラフィカルに可視化するためのノードとエッジの集合です。
 */
export interface DiagramData {
  /** ダイアグラム内のノード（用語）の配列 */
  nodes: DiagramNode[];
  /** ダイアグラム内のエッジ（関係性）の配列 */
  edges: DiagramEdge[];
}

/**
 * ダイアグラムのノード（用語）を表現する
 *
 * グラフ描画エンジンで使用されるノード情報を含みます。
 */
export interface DiagramNode {
  /** ノードの一意識別子。通常、用語IDまたはコンテキストID */
  id: string;
  /** ダイアグラムに表示されるノードのラベル */
  label: string;
  /** ノードの種類（例：term, context, proposal等） */
  type: string;
}

/**
 * ダイアグラムのエッジ（関係性）を表現する
 *
 * 2つのノード間の関係を視覚的に表示するための情報を含みます。
 */
export interface DiagramEdge {
  /** エッジの始点となるノードID */
  source: string;
  /** エッジの終点となるノードID */
  target: string;
  /** ダイアグラムに表示されるエッジのラベル */
  label: string;
  /** エッジの種類（例：aggregation, association, dependency, inheritance） */
  type: string;
}
