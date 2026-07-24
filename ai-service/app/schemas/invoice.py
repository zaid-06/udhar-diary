from datetime import date

from pydantic import BaseModel, Field


class InventoryItem(BaseModel):
    product_name: str = Field(
        description="Product name exactly as written on the invoice"
    )

    quantity: float = Field(
        description="Purchased quantity"
    )

    unit: str = Field(
        description="Measurement unit like kg, gm, litre, pcs etc."
    )

    purchase_price: float = Field(
        description="Purchase price of the product"
    )


class InventorySlip(BaseModel):
    purchase_date: date | None = Field(
        default=None,
        description="Purchase date mentioned on invoice"
    )

    items: list[InventoryItem]