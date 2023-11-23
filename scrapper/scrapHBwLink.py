from bs4 import BeautifulSoup
import requests
import json
import sys

#product = "https://hypeboost.com/es/producto/nike-dunk-low-smoke-grey-gum-3m-swoosh"
product  = sys.argv[1]

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
    "size_price": size_price,
}

# Convertir el objeto JSON en una cadena y mostrarlo
output_json = json.dumps(info, ensure_ascii=True)
print(output_json)