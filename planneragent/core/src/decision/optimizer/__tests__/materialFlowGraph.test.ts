import { buildMaterialFlowGraph } from "../materialFlowGraph.v1";

describe("MaterialFlowGraph", () => {

  test("should build graph from inferred BOM", () => {

    const graph = buildMaterialFlowGraph({

      orders: [
        { orderId: "O1", sku: "FG_A", qty: 10 }
      ],

      inventory: [
        { sku: "COMP_X", onHand: 5 },
        { sku: "COMP_Y", onHand: 10 }
      ],

      inferredBom: {
        bom: [
          {
            parent: "FG_A",
            components: [
              { component: "COMP_X", median_ratio: 2 },
              { component: "COMP_Y", median_ratio: 1 }
            ]
          }
        ]
      }

    });

    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    const fgNode = graph.nodes.find(n => n.id === "FG_A");

    expect(fgNode).toBeDefined();

    const edge = graph.edges.find(e => e.to === "FG_A");

    expect(edge).toBeDefined();

  });

});
