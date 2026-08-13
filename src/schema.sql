-- SQL Schema for Happy Labs Database
-- Compatible with SQLite3 and MySQL

-- Drop tables if they exist
DROP TABLE IF EXISTS portfolio_items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Create categories table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY /*!40101 AUTO_INCREMENT */,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Create portfolio_items table
CREATE TABLE portfolio_items (
    id INTEGER PRIMARY KEY /*!40101 AUTO_INCREMENT */,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL,
    img VARCHAR(255) NOT NULL,
    lead TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'published',
    FOREIGN KEY (category) REFERENCES categories(name)
);

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY /*!40101 AUTO_INCREMENT */,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Seed initial categories
INSERT INTO categories (name) VALUES 
('abstract'),
('illustration'),
('webdesign');

-- Seed initial users (Username: Happy, Password: Happy@2026)
INSERT INTO users (username, password) VALUES 
('Happy', 'Happy@2026');

-- Seed initial portfolio items
INSERT INTO portfolio_items (id, category, title, date, img, lead, body, status) VALUES
(1, 'abstract', 'Identity design for a trading company in Dubai', 'January 5, 2014', '/img/folio1.jpg', 'Identity & collateral design for Synergy Trading Associates DMCC.', 'Complete corporate identity including business card design, stationery, and brand guidelines for trading firm in Dubai.', 'published'),
(2, 'illustration', 'Local job portal', 'March 31, 2012', '/img/folio2.jpg', 'Brand identity & web portal UI for seekme.in.', 'Intuitive user portal design and 3D logo branding for regional employment platform.', 'published'),
(3, 'webdesign', 'Innovative packaging solutions', 'November 14, 2013', '/img/folio8.jpg', 'Structural eco packaging design.', 'Creative package design and prototype modeling for retail egg container product line.', 'published'),
(4, 'abstract', 'Branding solutions for fashion brand', 'February 15, 2014', '/img/folio5.jpg', 'Luxury gold foil identity for Velli Pattu.', 'Premium branding and metallic hot-foil emblem design for traditional silk saree label.', 'published'),
(5, 'abstract', 'Radio to be heard, it has to be seen', 'July 20, 2008', '/img/folio7.jpg', 'Brand identity for PSG Community Radio Station 107.8 MHz.', 'Stationery, listener passes, and visual identity for educational community broadcast radio.', 'published'),
(6, 'illustration', 'Traditional kerala sarees', 'February 28, 2014', '/img/folio3.jpg', 'Emblem logo for Apala Kerala Sarees.', 'Heritage illustration featuring backwaters, houseboat, and palm silhouette for saree boutique.', 'published'),
(7, 'illustration', 'Dance school identity design', 'August 15, 2006', '/img/folio6.jpg', 'Dynamic logo for Grease The Dance Studio.', 'Energetic typography and flame symbol design for professional dance training academy.', 'published'),
(8, 'illustration', 'Sweetened surprise', 'March 12, 2014', '/img/folio4.jpg', 'Packaging & badge design for Sree Balaji sweets & bakes.', 'Custom vintage seal logo and repeat pattern package wraps for confectionary store.', 'published'),
(9, 'webdesign', 'When you say good morning', 'October 2, 2013', '/img/folio9.jpg', 'Box packaging design for Uathayam.', 'Clean white 3D product box mockup with vibrant green leaf branding.', 'published'),
(10, 'webdesign', 'Taste the freshness', 'November 20, 2013', '/img/folio11.jpg', 'Oja Brew tea packaging collection.', 'Colorful outer carton graphics and sachet packaging for Hot & Cold tea varieties.', 'published'),
(11, 'webdesign', 'The Temptation of ice-cream', 'June 23, 2013', '/img/folio10.jpg', 'Fruste ice cream brochure catalog.', 'Mouthwatering dessert photography layout and promotional booklet design.', 'published'),
(12, 'webdesign', 'Shorba with a twist', 'November 20, 2013', '/img/folio12.jpg', 'Oja Shorba eco-cardboard boxes.', 'Kraft paper corrugated box branding for ready-to-serve food products.', 'published'),
(13, 'webdesign', 'The beauty secret of Indian royals', 'January 12, 2013', '/img/folio13.jpg', 'Ayurvedic cosmetics packaging range.', 'Royal vintage labels and bottle packaging design for herbal beauty products.', 'published'),
(14, 'illustration', 'Branding for Hospitality segment', 'March 17, 2014', '/img/folio14.jpg', 'Pandyan Paradise lodging & boarding identity.', 'Vibrant peacock mandala artwork and signage design for luxury hotel brand.', 'published'),
(15, 'webdesign', 'E-commerce experience design', 'April 10, 2014', '/img/folio15.jpg', 'Cozium home comfort store UI design.', 'Modern web layout and shopping catalog interface for lifestyle bedding brand.', 'published');
