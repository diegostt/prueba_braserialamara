import re

with open("carta.html", "r", encoding="utf-8") as f:
    text = f.read()

# Pattern: <div class="menu-item"><span class="item-name">NAME</span><span class="item-prices">...</span></div>
# We want to insert the button inside the menu-item at the end.
def replacer(match):
    return match.group(1) + '<button class="add-cart-btn" onclick="addToCart(this)" aria-label="Añadir">+</button></div>'

new_text = re.sub(r'(<div class="menu-item">.*?</span.*?>)</div>', replacer, text, flags=re.DOTALL)

with open("carta.html", "w", encoding="utf-8") as f:
    f.write(new_text)

print("Updated carta.html")
