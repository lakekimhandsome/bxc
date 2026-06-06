class PriceChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  setData(history) {
    this.data = history.map((h) => h.price);
    this.draw();
  }

  addPoint(price) {
    this.data.push(price);
    if (this.data.length > 100) this.data.shift();
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    if (this.data.length < 2) {
      ctx.strokeStyle = '#30363d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min || 1;
    const padding = 8;

    const points = this.data.map((price, i) => ({
      x: padding + (i / (this.data.length - 1)) * (w - padding * 2),
      y: padding + (1 - (price - min) / range) * (h - padding * 2),
    }));

    const isUp = this.data[this.data.length - 1] >= this.data[0];
    const lineColor = isUp ? '#3fb950' : '#f85149';
    const fillColor = isUp ? 'rgba(63, 185, 80, 0.08)' : 'rgba(248, 81, 73, 0.08)';

    ctx.beginPath();
    ctx.moveTo(points[0].x, h);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
