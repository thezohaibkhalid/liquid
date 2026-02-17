package main

import (
	"fmt"
	"os"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/osteele/liquid"
)

// Template Management
var (
	templateCache = make(map[string]liquid.Template)
	cacheMutex    = sync.RWMutex{}
	isDev         = os.Getenv("GO_ENV") != "production"
	engine        = liquid.NewEngine()
)

func renderTemplate(c *fiber.Ctx, templatePath string, data fiber.Map) error {
	var tmpl *liquid.Template
	var err error

	if !isDev {
		cacheMutex.RLock()
		cachedTmpl, ok := templateCache[templatePath]
		cacheMutex.RUnlock()
		if ok {
			tmpl = &cachedTmpl
		}
	}

	if tmpl == nil {
		templateBytes, err := os.ReadFile("./templates/" + templatePath)
		if err != nil {
			return c.Status(404).SendString("Template not found: " + templatePath)
		}
		parsedTmpl, err := engine.ParseTemplate(templateBytes)
		if err != nil {
			return c.Status(500).SendString("Template parsing error: " + err.Error())
		}
		tmpl = parsedTmpl

		if !isDev {
			cacheMutex.Lock()
			templateCache[templatePath] = *tmpl
			cacheMutex.Unlock()
		}
	}

	// Add common data
	data["current_year"] = 2026
	data["site_name"] = "Gourmet Grill"

	// Convert fiber.Map to liquid.Bindings (map[string]interface{})
	bindings := make(liquid.Bindings)
	for k, v := range data {
		bindings[k] = v
	}

	output, err := tmpl.Render(bindings)
	if err != nil {
		return c.Status(500).SendString("Rendering error: " + err.Error())
	}

	return c.Type("html").SendString(string(output))
}

func main() {
	app := fiber.New()

	// Serve static files
	app.Static("/static", "./static")

	// Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return renderTemplate(c, "index.liquid", fiber.Map{
			"title": "Gourmet Grill | Best Steaks in Town",
			"hero": fiber.Map{
				"title":    "Experience Culinary Excellence",
				"subtitle": "From farm to table, we serve the finest ingredients with passion.",
				"image":    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80",
			},
			"featured_categories": []fiber.Map{
				{"name": "Signature Steaks", "image": "https://images.unsplash.com/photo-1546248133-12832329b310?w=400"},
				{"name": "Fresh Seafood", "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400"},
				{"name": "Craft Cocktails", "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400"},
			},
		})
	})

	app.Get("/menu", func(c *fiber.Ctx) error {
		return renderTemplate(c, "menu.liquid", fiber.Map{
			"title": "Our Menu | Gourmet Grill",
			"products": []fiber.Map{
				{
					"id":          1,
					"name":        "Classic Ribeye",
					"description": "300g Aged Angus Ribeye with garlic butter and rosemary.",
					"base_price":  34.99,
					"image":       "https://images.unsplash.com/photo-1546248133-12832329b310?w=600",
					"variants": []fiber.Map{
						{"name": "Rare", "price_adj": 0},
						{"name": "Medium Rare", "price_adj": 0},
						{"name": "Medium", "price_adj": 0},
						{"name": "Well Done", "price_adj": 0},
					},
					"add_ons": []fiber.Map{
						{"name": "Truffle Butter", "price": 4.50},
						{"name": "Grilled Prawns", "price": 12.00},
					},
				},
				{
					"id":          2,
					"name":        "Atlantic Salmon",
					"description": "Pan-seared salmon with asparagus and lemon hollandaise.",
					"base_price":  28.50,
					"image":       "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
					"variants": []fiber.Map{
						{"name": "Standard", "price_adj": 0},
						{"name": "Large Cut", "price_adj": 8.00},
					},
				},
			},
		})
	})

	app.Get("/checkout", func(c *fiber.Ctx) error {
		return renderTemplate(c, "checkout.liquid", fiber.Map{
			"title": "Secure Checkout | Gourmet Grill",
			"cart_items": []fiber.Map{
				{"name": "Classic Ribeye", "variant": "Medium Rare", "price": 34.99, "qty": 1},
				{"name": "Truffle Butter", "variant": "Add-on", "price": 4.50, "qty": 1},
			},
			"total": 39.49,
		})
	})

	fmt.Println("Server starting on :8000...")
	app.Listen(":8000")
}
