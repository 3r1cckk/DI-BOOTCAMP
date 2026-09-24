--
-- PostgreSQL database dump
--

\restrict nIasjUQAyn359hGdcEU8tESZiz6cmMNfC9KOHOZqOzPmWpELO3PSfG2lhm8XqB1

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-09-23 12:41:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 16465)
-- Name: actors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actors (
    actor_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    age date NOT NULL,
    number_oscars integer DEFAULT 0
);


ALTER TABLE public.actors OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16464)
-- Name: actors_actor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actors_actor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actors_actor_id_seq OWNER TO postgres;

--
-- TOC entry 4919 (class 0 OID 0)
-- Dependencies: 222
-- Name: actors_actor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actors_actor_id_seq OWNED BY public.actors.actor_id;


--
-- TOC entry 4761 (class 2604 OID 16468)
-- Name: actors actor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actors ALTER COLUMN actor_id SET DEFAULT nextval('public.actors_actor_id_seq'::regclass);


--
-- TOC entry 4913 (class 0 OID 16465)
-- Dependencies: 223
-- Data for Name: actors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actors (actor_id, first_name, last_name, age, number_oscars) FROM stdin;
1	Angelina	Jolie	1975-06-04	1
2	Angelina	Jolie	1975-06-04	1
\.


--
-- TOC entry 4920 (class 0 OID 0)
-- Dependencies: 222
-- Name: actors_actor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actors_actor_id_seq', 2, true);


--
-- TOC entry 4764 (class 2606 OID 16475)
-- Name: actors actors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actors
    ADD CONSTRAINT actors_pkey PRIMARY KEY (actor_id);


-- Completed on 2026-09-23 12:41:25

--
-- PostgreSQL database dump complete
--

\unrestrict nIasjUQAyn359hGdcEU8tESZiz6cmMNfC9KOHOZqOzPmWpELO3PSfG2lhm8XqB1

