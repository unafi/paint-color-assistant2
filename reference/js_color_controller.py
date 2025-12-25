"""
JavaScript色調コントローラーコンポーネント

クライアント側でリアルタイム色調整を行うJavaScriptベースのUI
"""

import streamlit as st
import streamlit.components.v1 as components
from typing import Optional, Dict, Any
from .models import ColorModel


class JSColorControllerComponent:
    """
    JavaScriptベースの色調コントローラーコンポーネント
    
    Chroma.jsを使用してクライアント側でリアルタイム色調整を実現
    """
    
    def __init__(self, initial_color: Optional[ColorModel] = None):
        self.color = initial_color or ColorModel()
    
    def render(self, label: str, key_prefix: str, height: int = 400) -> Optional[Dict[str, Any]]:
        """
        JavaScript色調コントローラーUIを描画
        
        Args:
            label: 表示ラベル（例: "色A", "色B"）
            key_prefix: Streamlitキーのプレフィックス
            height: コンポーネントの高さ
            
        Returns:
            調整された色データ、変更がない場合はNone
        """
        if not self.color or (self.color.r == 0 and self.color.g == 0 and self.color.b == 0):
            st.info(f"🔍 {label}が選択されていません\n\n画像上をクリックして色を選択してください")
            return None
        
        st.markdown(f"#### 🎨 {label} 色調コントローラー（JavaScript版）")
        
        # 初期色データ
        initial_data = {
            "r": self.color.r,
            "g": self.color.g,
            "b": self.color.b,
            "c": self.color.c,
            "m": self.color.m,
            "y": self.color.y,
            "k": self.color.k
        }
        
        # JavaScriptコンポーネントを描画
        html_code = self._generate_html_code(initial_data, key_prefix, label)
        
        # コンポーネントを表示し、戻り値を取得
        result = components.html(html_code, height=height, key=f"js_color_controller_{key_prefix}")
        
        return result
    
    def _generate_html_code(self, initial_data: Dict[str, float], key_prefix: str, label: str) -> str:
        """JavaScript色調整UIのHTMLコードを生成"""
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <script>
                // 基本的な色変換関数（Chroma.jsの代替）
                function rgbToCmyk(r, g, b) {{
                    r = r / 255;
                    g = g / 255;
                    b = b / 255;
                    
                    const k = 1 - Math.max(r, g, b);
                    if (k === 1) {{
                        return [0, 0, 0, 100];
                    }}
                    
                    const c = (1 - r - k) / (1 - k);
                    const m = (1 - g - k) / (1 - k);
                    const y = (1 - b - k) / (1 - k);
                    
                    return [c * 100, m * 100, y * 100, k * 100];
                }}
                
                function cmykToRgb(c, m, y, k) {{
                    c = c / 100;
                    m = m / 100;
                    y = y / 100;
                    k = k / 100;
                    
                    const r = Math.round(255 * (1 - c) * (1 - k));
                    const g = Math.round(255 * (1 - m) * (1 - k));
                    const b = Math.round(255 * (1 - y) * (1 - k));
                    
                    return [r, g, b];
                }}
                
                function rgbToHex(r, g, b) {{
                    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                }}
            </script>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #fafafa;
                }}
                
                .color-controller {{
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                }}
                
                .target-color {{
                    flex: 1;
                    text-align: center;
                }}
                
                .color-preview {{
                    width: 150px;
                    height: 200px;
                    border: 4px solid #90EE90;
                    border-radius: 8px;
                    margin: 10px auto;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }}
                
                .controls {{
                    flex: 2;
                    padding: 0 20px;
                }}
                
                .control-group {{
                    margin-bottom: 20px;
                }}
                
                .control-row {{
                    display: flex;
                    align-items: center;
                    margin-bottom: 10px;
                    gap: 10px;
                }}
                
                .color-sample {{
                    width: 20px;
                    height: 20px;
                    border: 1px solid #333;
                    border-radius: 2px;
                }}
                
                .label {{
                    font-weight: bold;
                    width: 20px;
                }}
                
                .button-group {{
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }}
                
                .control-button {{
                    width: 30px;
                    height: 30px;
                    border: 1px solid #ccc;
                    background: white;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 14px;
                }}
                
                .control-button:hover {{
                    background: #f0f0f0;
                }}
                
                .value-display {{
                    width: 60px;
                    text-align: center;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background: white;
                }}
                
                .single-color {{
                    width: 30px;
                    height: 30px;
                    border: 1px solid #333;
                    border-radius: 2px;
                }}
                
                .result-color {{
                    flex: 1;
                    text-align: center;
                }}
                
                .result-preview {{
                    width: 150px;
                    height: 200px;
                    border: 2px solid #333;
                    border-radius: 8px;
                    margin: 10px auto;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }}
                
                .hex-display {{
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                }}
                
                .reset-button {{
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }}
                
                .reset-button:hover {{
                    background: #ff5252;
                }}
            </style>
        </head>
        <body>
            <div class="color-controller">
                <!-- 目的色表示 -->
                <div class="target-color">
                    <h4>目的色</h4>
                    <div id="target-preview" class="color-preview"></div>
                    <div id="target-hex" class="hex-display"></div>
                </div>
                
                <!-- 色調整コントロール -->
                <div class="controls">
                    <h4>色調整</h4>
                    
                    <!-- RGB調整 -->
                    <div class="control-group">
                        <h5>RGB</h5>
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #ff0000;"></div>
                            <div class="label">R</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('r', -1)">◀</button>
                                <div id="r-value" class="value-display">0</div>
                                <button class="control-button" onclick="adjustValue('r', 1)">▶</button>
                            </div>
                            <div id="r-single" class="single-color"></div>
                        </div>
                        
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #00ff00;"></div>
                            <div class="label">G</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('g', -1)">◀</button>
                                <div id="g-value" class="value-display">0</div>
                                <button class="control-button" onclick="adjustValue('g', 1)">▶</button>
                            </div>
                            <div id="g-single" class="single-color"></div>
                        </div>
                        
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #0000ff;"></div>
                            <div class="label">B</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('b', -1)">◀</button>
                                <div id="b-value" class="value-display">0</div>
                                <button class="control-button" onclick="adjustValue('b', 1)">▶</button>
                            </div>
                            <div id="b-single" class="single-color"></div>
                        </div>
                    </div>
                    
                    <!-- CMYK調整 -->
                    <div class="control-group">
                        <h5>CMYK</h5>
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #00ffff;"></div>
                            <div class="label">C</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('c', -0.1)">◀</button>
                                <div id="c-value" class="value-display">0.0</div>
                                <button class="control-button" onclick="adjustValue('c', 0.1)">▶</button>
                            </div>
                            <div id="c-single" class="single-color"></div>
                        </div>
                        
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #ff00ff;"></div>
                            <div class="label">M</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('m', -0.1)">◀</button>
                                <div id="m-value" class="value-display">0.0</div>
                                <button class="control-button" onclick="adjustValue('m', 0.1)">▶</button>
                            </div>
                            <div id="m-single" class="single-color"></div>
                        </div>
                        
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #ffff00;"></div>
                            <div class="label">Y</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('y', -0.1)">◀</button>
                                <div id="y-value" class="value-display">0.0</div>
                                <button class="control-button" onclick="adjustValue('y', 0.1)">▶</button>
                            </div>
                            <div id="y-single" class="single-color"></div>
                        </div>
                        
                        <div class="control-row">
                            <div class="color-sample" style="background-color: #000000;"></div>
                            <div class="label">K</div>
                            <div class="button-group">
                                <button class="control-button" onclick="adjustValue('k', -0.1)">◀</button>
                                <div id="k-value" class="value-display">0.0</div>
                                <button class="control-button" onclick="adjustValue('k', 0.1)">▶</button>
                            </div>
                            <div id="k-single" class="single-color"></div>
                        </div>
                    </div>
                    
                    <button class="reset-button" onclick="resetColor()">🔄 {label}をリセット</button>
                </div>
                
                <!-- 結果色表示 -->
                <div class="result-color">
                    <h4>結果色</h4>
                    <div id="result-preview" class="result-preview"></div>
                    <div id="result-rgb" class="hex-display"></div>
                </div>
            </div>
            
            <script>
                // 初期色データ
                let colorData = {initial_data};
                let updateSource = null; // ループ防止用
                
                // 初期化
                function init() {{
                    updateAllDisplays();
                }}
                
                // 値調整
                function adjustValue(component, delta) {{
                    updateSource = component;
                    
                    if (['r', 'g', 'b'].includes(component)) {{
                        // RGB調整
                        colorData[component] = Math.max(0, Math.min(255, colorData[component] + delta));
                        updateFromRGB();
                    }} else {{
                        // CMYK調整
                        colorData[component] = Math.max(0, Math.min(100, colorData[component] + delta));
                        updateFromCMYK();
                    }}
                    
                    updateAllDisplays();
                    sendToStreamlit();
                    updateSource = null;
                }}
                
                // RGB値からCMYK値を更新
                function updateFromRGB() {{
                    if (updateSource && ['c', 'm', 'y', 'k'].includes(updateSource)) return;
                    
                    try {{
                        const cmyk = rgbToCmyk(colorData.r, colorData.g, colorData.b);
                        colorData.c = cmyk[0];
                        colorData.m = cmyk[1];
                        colorData.y = cmyk[2];
                        colorData.k = cmyk[3];
                    }} catch (e) {{
                        console.warn('RGB to CMYK conversion error:', e);
                    }}
                }}
                
                // CMYK値からRGB値を更新
                function updateFromCMYK() {{
                    if (updateSource && ['r', 'g', 'b'].includes(updateSource)) return;
                    
                    try {{
                        const rgb = cmykToRgb(colorData.c, colorData.m, colorData.y, colorData.k);
                        colorData.r = rgb[0];
                        colorData.g = rgb[1];
                        colorData.b = rgb[2];
                    }} catch (e) {{
                        console.warn('CMYK to RGB conversion error:', e);
                    }}
                }}
                
                // 全ての表示を更新
                function updateAllDisplays() {{
                    // 値表示を更新
                    document.getElementById('r-value').textContent = Math.round(colorData.r);
                    document.getElementById('g-value').textContent = Math.round(colorData.g);
                    document.getElementById('b-value').textContent = Math.round(colorData.b);
                    document.getElementById('c-value').textContent = colorData.c.toFixed(1);
                    document.getElementById('m-value').textContent = colorData.m.toFixed(1);
                    document.getElementById('y-value').textContent = colorData.y.toFixed(1);
                    document.getElementById('k-value').textContent = colorData.k.toFixed(1);
                    
                    // 単色見本を更新
                    document.getElementById('r-single').style.backgroundColor = `rgb(${{colorData.r}}, 0, 0)`;
                    document.getElementById('g-single').style.backgroundColor = `rgb(0, ${{colorData.g}}, 0)`;
                    document.getElementById('b-single').style.backgroundColor = `rgb(0, 0, ${{colorData.b}})`;
                    
                    // CMYK単色見本を更新
                    try {{
                        // C単色: C:value, M:0, Y:0, K:残%
                        const cRgb = cmykToRgb(colorData.c, 0, 0, 100 - colorData.c);
                        const cHex = rgbToHex(cRgb[0], cRgb[1], cRgb[2]);
                        
                        // M単色: C:0, M:value, Y:0, K:残%  
                        const mRgb = cmykToRgb(0, colorData.m, 0, 100 - colorData.m);
                        const mHex = rgbToHex(mRgb[0], mRgb[1], mRgb[2]);
                        
                        // Y単色: C:0, M:0, Y:value, K:残%
                        const yRgb = cmykToRgb(0, 0, colorData.y, 100 - colorData.y);
                        const yHex = rgbToHex(yRgb[0], yRgb[1], yRgb[2]);
                        
                        // K単色: C:0, M:0, Y:0, K:value
                        const kRgb = cmykToRgb(0, 0, 0, colorData.k);
                        const kHex = rgbToHex(kRgb[0], kRgb[1], kRgb[2]);
                        
                        document.getElementById('c-single').style.backgroundColor = cHex;
                        document.getElementById('m-single').style.backgroundColor = mHex;
                        document.getElementById('y-single').style.backgroundColor = yHex;
                        document.getElementById('k-single').style.backgroundColor = kHex;
                    }} catch (e) {{
                        console.warn('CMYK single color update error:', e);
                    }}
                    
                    // 結果色を更新
                    const resultColor = `rgb(${{colorData.r}}, ${{colorData.g}}, ${{colorData.b}})`;
                    document.getElementById('target-preview').style.backgroundColor = resultColor;
                    document.getElementById('result-preview').style.backgroundColor = resultColor;
                    
                    // HEX表示を更新
                    const hex = rgbToHex(colorData.r, colorData.g, colorData.b);
                    document.getElementById('target-hex').textContent = `HEX: ${{hex}}`;
                    document.getElementById('result-rgb').textContent = `RGB: ${{colorData.r}}, ${{colorData.g}}, ${{colorData.b}}`;
                }}
                
                // Streamlitにデータを送信（デバウンス付き）
                let sendTimeout = null;
                function sendToStreamlit() {{
                    // 前回のタイムアウトをクリア
                    if (sendTimeout) {{
                        clearTimeout(sendTimeout);
                    }}
                    
                    // 500ms後に送信（デバウンス）
                    sendTimeout = setTimeout(() => {{
                        window.parent.postMessage({{
                            type: 'streamlit:setComponentValue',
                            value: colorData
                        }}, '*');
                    }}, 500);
                }}
                
                // リセット
                function resetColor() {{
                    if (confirm('{label}をリセットしますか？')) {{
                        window.parent.postMessage({{
                            type: 'streamlit:setComponentValue',
                            value: null
                        }}, '*');
                    }}
                }}
                
                // 初期化実行
                init();
            </script>
        </body>
        </html>
        """
    
    def update_color(self, color_model: ColorModel):
        """色を更新"""
        if color_model:
            self.color = color_model.copy()
    
    def get_current_color(self) -> Optional[ColorModel]:
        """現在の色を取得"""
        return self.color.copy() if self.color else None