"""
Template scraper for the first two steps of Udyam registration.
Requires: pip install selenium
Download matching chromedriver and set CHROMEDRIVER_PATH.
"""
import json, time, re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

CHROMEDRIVER_PATH = "./chromedriver"  # change if needed

def add_field(schema, step, label, elem_id, elem_type="text", regex="^.*$", placeholder="", required=True):
    schema[step].append({
        "label": label,
        "id": elem_id,
        "type": elem_type,
        "placeholder": placeholder,
        "validation": regex,
        "required": required
    })

def main():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(service=Service(CHROMEDRIVER_PATH), options=options)
    driver.get("https://udyamregistration.gov.in/UdyamRegistration.aspx")
    time.sleep(3)

    schema = {"step1": [], "step2": []}

    try:
        aad = driver.find_element(By.XPATH, "//input[contains(@id,'Aadhar') or contains(@placeholder,'Aadhaar') or contains(@id,'Aadhaar')]")
        add_field(schema, "step1", "Aadhaar Number", aad.get_attribute("id") or "aadhaar", "text", r"^[0-9]{12}$", "12-digit Aadhaar")
    except Exception:
        add_field(schema, "step1", "Aadhaar Number", "aadhaar", "text", r"^[0-9]{12}$", "12-digit Aadhaar")

    try:
        name = driver.find_element(By.XPATH, "//input[contains(@id,'Name') or contains(@placeholder,'Name')][1]")
        add_field(schema, "step1", "Name of Applicant", name.get_attribute("id") or "name", "text", r"^[A-Za-z ]{3,}$", "Full name")
    except Exception:
        add_field(schema, "step1", "Name of Applicant", "name", "text", r"^[A-Za-z ]{3,}$", "Full name")

    try:
        mob = driver.find_element(By.XPATH, "//input[contains(@id,'Mobile') or contains(@placeholder,'Mobile') or contains(@id,'Phone')]")
        add_field(schema, "step1", "Mobile Number", mob.get_attribute("id") or "mobile", "text", r"^[6-9][0-9]{9}$", "10-digit mobile")
    except Exception:
        add_field(schema, "step1", "Mobile Number", "mobile", "text", r"^[6-9][0-9]{9}$", "10-digit mobile")

    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)

    try:
        pan = driver.find_element(By.XPATH, "//input[contains(@id,'PAN') or contains(@placeholder,'PAN') or contains(@name,'Pan')]")
        add_field(schema, "step2", "PAN Number", pan.get_attribute("id") or "pan", "text", r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$", "ABCDE1234F")
    except Exception:
        add_field(schema, "step2", "PAN Number", "pan", "text", r"^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$", "ABCDE1234F")

    add_field(schema, "step2", "Pincode", "pincode", "text", r"^[1-9][0-9]{5}$", "110001")
    add_field(schema, "step2", "State", "state", "text", r"^.{2,}$", "Auto filled (from pincode)")
    add_field(schema, "step2", "City", "city", "text", r"^.{2,}$", "Auto filled (from pincode)")

    driver.quit()
    with open("udyam_schema.json", "w") as f:
        json.dump(schema, f, indent=2)
    print("Saved udyam_schema.json")

if __name__ == "__main__":
    main()
