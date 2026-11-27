# 英文摄影提示词

每张独立成文，按实际镜头决定画幅、焦段与距离，附件增减后同步改写编号。

1. **画面与态度。** 先写主体正在做什么，交代重心、肩颈、视线、嘴角、机位和取景边界。纯细节镜头改写部件、可见范围与观察角度。
2. **光。** 露脸时先写本张光从画面哪一侧来，以及为什么选这一侧：照亮未被手、头发或器材遮挡的脸，让抬膝或雪板等前景处在柔和的半阴影里，兼顾脸的转向与画面留白。项目记录用一句话记下理由；同组多张避免全部同侧，除非 madao 指定。再写可见证据：镜头一侧约 45° 高的正午太阳从侧前方照脸，高海拔薄雾柔化日光，周围亮雪提供充足的大面积反光（abundant snow bounce）。脸整体明亮、低反差，鼻梁有细亮线，远侧鼻翼旁只有一小块淡柔影，颧骨及额头受光，眼窝通透。人影在身后斜侧，不朝镜头；头发、肩膀和帽兜无亮边或光晕，远处雪坡与脸同侧受光。雪地反光托亮下颌、眼窝和褶谷，让暗处仍能辨认衣服本色。无脸入镜时写光落在哪块衣料及褶谷里的反射。

   **色彩与调性。** 中性偏冷的正午日光，高光干净白，雪面纯白偏蓝白，阴影带冷蓝灰。浅青蓝天空向地平线宽缓变淡。排除黄昏或金色时段光、暖黄偏色、胶片调色与胶片颗粒。只在天空、雪地与衣服暗部轻微去饱和、抬暗部、降局部反差，亮部略微泛白、发柔，高光柔和过渡。脸保留清楚的日光结构，只有皮肤自然偏暖，保留真实质感和细窄亮线；衣身保留本款实色，深色不洗灰。

3. **产品。** 用 2–3 句指明当次产品图和容易画错的事实；纯文字任务只写已指定的款色与结构。
4. **参考职责。** 按实际附件顺序逐张写 Image N 的取用与排除项。MC 唯一确定身份，B01 唯一确定太阳方向和面部塑形，动作与环境分别指定来源。若传入已认可案例，只写它的职责，取整体调性、光色完成度或动作景别，并排除它的人脸、衣服事实、头盔雪杖雪板和背景山体。

避免在正向提示词里用 sharp、crisp、ultra-detailed、fine skin detail、micro-contrast、HDR 等推高局部反差的词。

## 母版示例（未经生成验证）

本例输入顺序为 Image 1 产品图，Image 2 MC，Image 3 B01，Image 4 B02，Image 5 动作参考（可选）。省去动作参考时，删去相应的引用。PRODUCT 段只适用于 JOHNSNOW 酒红款；换产品时必须按新产品替换整段。姿势、配饰与镜头参数也只用于本例。

本例托腮的手和抬起的膝盖在画面左侧，所以光从画面右侧来，照亮露出的半边脸。换图时按当张画面重新选边，不能照抄本例的左右。

```text
One standalone photorealistic brand campaign photograph for the Shanyuchang snowboard wear brand. Portrait 3:4. A single photograph, not a collage or multi-panel sheet. No added text, logo overlay or border.

THE PICTURE: The woman from Image 2, about 25, sits on a rounded snow bank with one knee raised, her elbow resting lightly on it and fingertips just under her chin; her hand and raised knee are on the image-left side. Torso tall, shoulders easy, chin level. She looks calmly into the lens with a composed, closed-mouth expression: confident, not performing for the camera. Ivory beanie with goggles pushed up, face fully visible. Camera slightly below her eye level, about 2 m away, natural 70 mm perspective, framed from just above the beanie to mid-thigh.

LIGHT: High midday sun from behind the photographer's right shoulder, so it falls on the open image-right side of her face while her hand and knee sit in gentle half-shade. The sun is softened by thin high-altitude haze and by abundant light bouncing off the bright snow all around her: soft-edged shadows, a luminous low-contrast face, a fine bright line on the nose bridge, only a faint soft shadow beside the nose on the far side, lit cheekbones and open, airy eye sockets. Generous snow bounce fills the jaw, the eye sockets and every fold of the jacket, so the burgundy stays readable in the shadows; no hard cast shadows from the arm or hand across the jacket. Her shadow falls softly behind her, away from the camera. No rim light, no glowing hair halo, no bright outline on the shoulders or hood. The distant snow slopes are lit from the same side as her face.

COLOR AND TONE: Neutral to slightly cool midday daylight with clean white highlights. Not golden hour, not sunset, no warm yellow cast, no film grading or film grain. Pure blue-white snow with faint cool blue-gray shadows. In the sky, the snow and the shadow areas of the clothing: low-to-medium saturation, bright areas slightly whitened and soft, shadows lifted, low local contrast, soft highlight roll-off. Her face keeps its gentle sunlit structure. Pale cyan-blue sky fading lighter toward the horizon; distant mountains small, pale and soft. Natural warm skin with real texture and only a fine sheen on the nose bridge and cheekbones, no broad oily patches. The garment keeps its full true color.

PRODUCT: Image 1 is the only authority for the garment: the loose deep wine burgundy snowboard jacket and matching baggy trousers, two chest flap pockets with ivory inset edges, black slanted hand-pocket zips and the small original chest wordmark as printed.

REFERENCES: Image 2 is a model card: use only her face, features, skin tone, freckles, eye color and dark brown hair, not its gray studio backdrop, flat light, T-shirt or three-panel layout. Image 3 is the authority for sun direction, softness and facial modeling: front-side sun softened by abundant snow bounce, luminous low-contrast face, nose bridge highlight and a faint nose-side shadow; not the child, her wink, smile, clothing or logos. Image 4 is for sky color and airy gradient only, not its sun position, glow or backlight, and not the child, the inflatable ring or logos. Image 5 is a pose reference only: body position and framing, not its light, mountain backdrop, model, clothing, text or color treatment.
```
