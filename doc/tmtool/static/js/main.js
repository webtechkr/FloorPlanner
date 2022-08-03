function init() {
  const $ = go.GraphObject.make; // for conciseness in defining templates

  function isUnoccupied(r, node) {
    var diagram = node.diagram;

    function navig(obj) {
      var part = obj.part;
      if (part === node) return null;
      if (part instanceof go.Link) return null;
      if (part.isMemberOf(node)) return null;
      if (node.isMemberOf(part)) return null;
      return part;
    }

    // only consider non-temporary Layers
    var lit = diagram.layers;
    while (lit.next()) {
      var lay = lit.value;
      if (lay.isTemporary) continue;
      if (lay.findObjectsIn(r, navig, null, true).count > 0) return false;
    }
    return true;
  }

  function avoidNodeOverlap(node, pt, gridpt) {
    if (node.diagram instanceof go.Palette) return gridpt;
    // this assumes each node is fully rectangular
    var bnds = node.actualBounds;
    var loc = node.location;
    var r = new go.Rect(
      gridpt.x - (loc.x - bnds.x),
      gridpt.y - (loc.y - bnds.y),
      bnds.width,
      bnds.height
    );
    r.inflate(-0.5, -0.5); // by default, deflate to avoid edge overlaps with "exact" fits

    if (
      !(node.diagram.currentTool instanceof go.DraggingTool) &&
      (!node._temp || !node.layer.isTemporary)
    ) {
      // in Temporary Layer during external drag-and-drop
      node._temp = true; // flag to avoid repeated searches during external drag-and-drop
      while (!isUnoccupied(r, node)) {
        r.x += 10; // note that this is an unimaginative search algorithm --
        r.y += 2; // you can improve the search here to be more appropriate for your app
      }
      r.inflate(0.5, 0.5); // restore to actual size
      // return the proposed new location point
      return new go.Point(r.x - (loc.x - bnds.x), r.y - (loc.y - bnds.y));
    }
    if (isUnoccupied(r, node)) return gridpt; // OK
    return loc; // give up -- don't allow the node to be moved to the new location
  }

  myDiagram = $(go.Diagram, "myDiagramDiv", {
    "animationManager.isEnabled": false,
    "undoManager.isEnabled": true,
  });

  // Define the template for Nodes, just some text inside a colored rectangle
  myDiagram.nodeTemplate = $(
    go.Node,
    "Auto",
    { dragComputation: avoidNodeOverlap },
    { minSize: new go.Size(50, 20), resizable: true },
    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(
      go.Size.stringify
    ),
    new go.Binding("position", "pos", go.Point.parse).makeTwoWay(
      go.Point.stringify
    ),
    // temporarily put selected nodes in Foreground layer
    new go.Binding("layerName", "isSelected", (s) =>
      s ? "Foreground" : ""
    ).ofObject(),
    $(go.Shape, "Rectangle", new go.Binding("fill", "color")),
    $(go.TextBlock, new go.Binding("text", "color"))
  );

  myDiagram.model = new go.GraphLinksModel([
    { pos: "-30 0", size: "50 300", color: go.Brush.randomColor() },
    { pos: "120 20", size: "300 50", color: go.Brush.randomColor() },
    { pos: "100 200", size: "300 50", color: go.Brush.randomColor() },
    { pos: "500 50", size: "50 300", color: go.Brush.randomColor() },
    { key: 1, pos: "100 100", size: "50 50", color: "gray" },
    { key: 2, pos: "200 140", size: "50 50", color: "gray" },
  ]);

  myDiagram.findNodeForKey(1).isSelected = true;

  // initialize the Palette that is on the left side of the page
  myPalette = $(
    go.Palette,
    "myPaletteDiv", // must name or refer to the DIV HTML element
    {
      nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
      model: new go.GraphLinksModel([
        // specify the contents of the Palette
        { size: "50 50", color: go.Brush.randomColor() },
        { size: "60 40", color: go.Brush.randomColor() },
      ]),
    }
  );
}
window.addEventListener("DOMContentLoaded", init);
