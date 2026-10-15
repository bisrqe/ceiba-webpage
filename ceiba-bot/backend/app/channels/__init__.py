"""Adaptadores de canal. Para agregar uno nuevo (p. ej. Instagram o Microsoft Teams):
crea un archivo con una clase que herede de `Channel`, implementa parse/render y
regístralo en CHANNELS y en las rutas de main.py. Guía: docs/03_CONECTIVIDAD.md."""
from .messenger import MessengerChannel
from .telegram import TelegramChannel
from .web import WebChannel
from .whatsapp import WhatsAppChannel

CHANNELS = {
    "web": WebChannel(),
    "whatsapp": WhatsAppChannel(),
    "telegram": TelegramChannel(),
    "messenger": MessengerChannel(),
}

__all__ = ["CHANNELS", "WebChannel", "WhatsAppChannel", "TelegramChannel", "MessengerChannel"]
