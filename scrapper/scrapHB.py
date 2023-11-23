from bs4 import BeautifulSoup
import requests
import json
import sys

zapa = sys.argv[1]

website = 'https://hypeboost.com/es/search/shop?keyword=+'+zapa
res = requests.get(website)
content = res.text

soup = BeautifulSoup(content, 'html.parser')

SKU = soup.find('span', class_='grey').get_text()

if SKU != zapa:
    exit()
    
image = soup.find('img').get('src') #url de la imagen
name_product = soup.find('strong').get_text()

product = soup.find('a').get('href') #request de la url

found = requests.get(product) #tirar request de product
shoe = found.text #lo que devuelva lo movemos a texto

soup = BeautifulSoup(shoe, 'html.parser') 

sizes = soup.find('div', class_='sizes') #buscamos el div de las tallas, aqui tendremos las tallas y el precio

Quantity = sizes.find_all('div', class_='label') #buscamos en el div anterior las tallas
Prices = sizes.find_all('div', class_='price') #otra para buscar el precio

Quantity_text = [label.get_text() for label in Quantity] #recogemos las tallas, creando un array
Prices_text = [price.get_text() for price in Prices] #recogemos los precios, creando un array

size_price = []

for talla, precio in zip(Quantity_text, Prices_text):
    talla = talla.strip()
    precio = precio.strip()
    precio = precio.replace("\u20ac", "")
    
    # Crear un objeto JSON para cada par talla-precio
    size_price.append({
        "talla": talla,
        "precio": precio
    })

# Crear un objeto JSON con la información completa
info = {
    "name": name_product,
    "image": image,
    "size_price": size_price,
    "link": product
}

# Convertir el objeto JSON en una cadena y mostrarlo
output_json = json.dumps(info, ensure_ascii=True)
print(output_json)