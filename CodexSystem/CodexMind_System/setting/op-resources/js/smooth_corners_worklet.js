const kSmoothCornersKeys = {
  Radius: '--smooth-corners-radius',
  Exponent: '--smooth-corners-exponent',
  Color: '--smooth-corners-color',
  BorderWidth: '--smooth-corners-border-width',
};

class SmoothCornersPainter {
  static get inputProperties() {
    return [
      kSmoothCornersKeys.Radius,
      kSmoothCornersKeys.Exponent,
      kSmoothCornersKeys.Color,
      kSmoothCornersKeys.BorderWidth,
    ];
  }

  createSuperelipse(ctx, size, radius, exp, anticlockwise = false) {
    const width = size.width;
    const height = size.height;

    // Calculate the radius along the x and y axes
    const a = Math.min(radius * 2.4, width / 2);
    const b = Math.min(radius * 2.4, height / 2);

    // Generate |steps| number of sampling point based on angle
    const steps = 360;
    const angles = Array.from(
      {length: steps},
      (_, i) => (2 * Math.PI * i) / steps,
    );
    if (!anticlockwise) {
      angles.reverse();
    }
    let startPoint;

    for (let angle of angles) {
      // Superellipse parametric equations
      const x =
        a *
        Math.sign(Math.cos(angle)) *
        Math.pow(Math.abs(Math.cos(angle)), 2 / exp);
      const y =
        b *
        Math.sign(Math.sin(angle)) *
        Math.pow(Math.abs(Math.sin(angle)), 2 / exp);

      // Calculate offsets according to fill all edges with straight lines.
      //
      // Without these offsets, it only draws an actual superellipse within
      // the (0, 0, 2 * a, 2 * b) rectangle. These offsets essentially move the
      // four corners of such a superellipse to the edge of the drawing area.
      // And straight lines are connecting the corners.
      let offset_x = 0;
      let offset_y = 0;
      if (angle <= 0.5 * Math.PI) {
        // Top-left corner
        offset_x = width - 2 * a;
      } else if (angle <= Math.PI) {
        // Top-right corner
        offset_x = 0;
        offset_y = 0;
      } else if (angle <= 1.5 * Math.PI) {
        // Bottom-right corner
        offset_y = height - 2 * b;
      } else if (angle <= 2 * Math.PI) {
        // Bottom-left corner
        offset_x = width - 2 * a;
        offset_y = height - 2 * b;
      }

      const point = [a + x + offset_x, b - y + offset_y];
      if (angle === angles.at(0)) {
        startPoint = point;
        ctx.moveTo(point[0], point[1]);
      } else {
        ctx.lineTo(point[0], point[1]);
      }
    }

    ctx.lineTo(startPoint[0], startPoint[1]);
  }

  paint(ctx, size, props) {
    const radius = Number.parseFloat(props.get(kSmoothCornersKeys.Radius)) || 8;
    const exp = Number.parseFloat(props.get(kSmoothCornersKeys.Exponent)) || 4;
    const color = props.get(kSmoothCornersKeys.Color) || 'black';
    const borderWidth =
      Number.parseFloat(props.get(kSmoothCornersKeys.BorderWidth)) || 0;
    const hasBorder = borderWidth > 0;

    ctx.beginPath();
    this.createSuperelipse(ctx, size, radius, exp);

    if (hasBorder) {
      ctx.save();
      ctx.translate(borderWidth, borderWidth);
      this.createSuperelipse(
        ctx,
        {
          width: size.width - 2 * borderWidth,
          height: size.height - 2 * borderWidth,
        },
        radius - borderWidth,
        exp,
        true,
      );
      ctx.restore();
    }
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size.width, size.height);
  }
}

registerPaint('smooth-corners', SmoothCornersPainter);
