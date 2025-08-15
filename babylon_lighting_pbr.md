# Babylon.js Lighting and PBR Materials Guide

## 1. PBR Materials – metallic, roughness, albedo

PBR (Physically Based Rendering) là phương pháp mô phỏng ánh sáng và vật liệu dựa trên các quy luật vật lý, giúp cho hình ảnh hiển thị có độ chân thực cao hơn. Trong Babylon.js, PBR materials là loại vật liệu chính khi muốn đạt chất lượng hình ảnh cao, đặc biệt khi kết hợp với file GLTF/GLB.

- **Albedo**: Là màu cơ bản của bề mặt vật liệu, không bao gồm ảnh hưởng của ánh sáng hoặc bóng đổ. Trong thực tế, albedo giống như màu sơn hoặc màu tự nhiên của vật liệu. Khi thay đổi albedo, bạn thay đổi tông màu và độ sáng của vật liệu.

- **Metallic**: Xác định mức độ “kim loại” của vật liệu. Giá trị cao (1.0) nghĩa là vật liệu có tính phản xạ cao, phản chiếu môi trường rõ rệt và chịu ảnh hưởng màu sắc từ môi trường (như thép, vàng, đồng). Giá trị thấp (0.0) nghĩa là vật liệu phi kim loại (như gỗ, nhựa), chủ yếu tán xạ ánh sáng.

- **Roughness**: Quyết định độ nhám hoặc độ bóng của bề mặt. Roughness thấp (0.0) làm bề mặt bóng loáng, phản xạ sắc nét (như gương hoặc kính). Roughness cao (1.0) làm bề mặt mờ, phản xạ ánh sáng bị tán ra (như bề mặt bê tông, giấy nhám).

Khi thay đổi các thuộc tính này, Babylon.js sẽ tự động tính toán lại sự tương tác ánh sáng theo mô hình vật lý, giúp hiển thị sự thay đổi ngay lập tức.

---

## 2. HDR Lighting Environment

HDR (High Dynamic Range) lighting environment là kỹ thuật sử dụng hình ảnh HDRI (High Dynamic Range Image) làm nguồn sáng môi trường. HDRI chứa thông tin ánh sáng và màu sắc ở nhiều dải sáng tối hơn hình ảnh thông thường, cho phép mô phỏng ánh sáng môi trường chân thực hơn.

Trong Babylon.js, khi thiết lập HDR environment, engine sẽ sử dụng dữ liệu ánh sáng từ HDRI để chiếu sáng toàn bộ scene và tạo phản xạ trên các bề mặt PBR materials. Đặc biệt, khi kết hợp với metallic/roughness, ánh sáng từ HDRI sẽ tạo ra các phản xạ rất giống thực tế. HDR lighting cũng cho phép điều chỉnh cường độ, màu sắc và hướng ánh sáng môi trường.

---

## 3. Luminance Adjustment and Realistic Shadow Rendering

- **Luminance adjustment**: Là quá trình điều chỉnh độ sáng tổng thể của scene để phù hợp với điều kiện ánh sáng mong muốn. Babylon.js cho phép thiết lập camera exposure hoặc điều chỉnh ánh sáng môi trường để cân bằng giữa vùng sáng và vùng tối, giúp hình ảnh không bị quá sáng hoặc quá tối.

- **Realistic shadow rendering**: Là kỹ thuật tạo bóng đổ trông tự nhiên và đúng với nguồn sáng. Babylon.js hỗ trợ nhiều loại bóng như hard shadows (bóng sắc nét) và soft shadows (bóng mờ). Khi kết hợp với PBR materials và HDR lighting, bóng đổ sẽ mang màu sắc và độ mờ phù hợp với môi trường, giúp tăng độ chân thực cho scene.

Việc điều chỉnh luminance và bóng đổ giúp cho vật thể trong scene trông hòa hợp hơn với môi trường ánh sáng, tạo cảm giác chiều sâu và không gian thực.

---

## 4. A Comparison Environment for Baked vs Real-Time Lighting

- **Baked lighting**: Là ánh sáng được tính toán trước (offline) bằng các phần mềm 3D như Blender, 3ds Max. Kết quả ánh sáng, bóng đổ, phản xạ… được “nướng” thành texture (lightmap) và gắn cố định vào model. Ưu điểm là hiển thị rất nhanh, chất lượng cao, có thể mô phỏng Global Illumination. Nhược điểm là ánh sáng không thay đổi được khi runtime và cần chuẩn bị sẵn trong quá trình làm asset.

- **Real-time lighting**: Là ánh sáng được tính toán trực tiếp khi render, cho phép thay đổi vị trí, màu sắc, cường độ nguồn sáng ngay trong quá trình chạy ứng dụng. Ưu điểm là linh hoạt, tương tác được với người dùng và các hiệu ứng động. Nhược điểm là tiêu tốn hiệu năng và đôi khi chất lượng không đạt như baked lighting, đặc biệt với global illumination.

Babylon.js chủ yếu hỗ trợ real-time lighting, nhưng có thể hiển thị baked lighting nếu file GLTF/GLB đã có lightmap sẵn. Điều này giúp bạn kết hợp cả hai: dùng baked lighting cho ánh sáng môi trường và dùng real-time lighting cho các nguồn sáng động.
